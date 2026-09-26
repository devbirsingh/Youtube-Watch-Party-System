import React from "react";
import { useEffect, useRef } from "react";

let youtubeReadyPromise;

const loadYouTubeApi = () => {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeReadyPromise) {
    return youtubeReadyPromise;
  }

  youtubeReadyPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      "script[src='https://www.youtube.com/iframe_api']"
    );
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(
      () => reject(new Error("YouTube API failed to load")),
      10000
    );

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previousReady?.();
      resolve();
    };

    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube API failed to load"));
    document.head.appendChild(script);
  });

  return youtubeReadyPromise;
};

export default function YouTubePlayer({
  videoId,
  playState,
  currentTime,
  serverTime,
  canControl,
  onPlay,
  onPause,
  onSeek,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const stateRef = useRef({
    videoId,
    playState,
    currentTime,
    serverTime,
  });
  const mountedRef = useRef(false);
  const suppressUntilRef = useRef(0);
  const lastObservedTimeRef = useRef(null);
  const lastObservedAtRef = useRef(null);
  const lastSeekAtRef = useRef(0);
  const pollTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const handlersRef = useRef({ canControl, onPlay, onPause, onSeek });

  useEffect(() => {
    stateRef.current = {
      videoId,
      playState,
      currentTime,
      serverTime,
    };
  }, [videoId, playState, currentTime, serverTime]);

  useEffect(() => {
    handlersRef.current = { canControl, onPlay, onPause, onSeek };
  }, [canControl, onPlay, onPause, onSeek]);

  const restoreAuthoritativeState = () => {
    const player = playerRef.current;
    const state = stateRef.current;

    if (
      !player ||
      !state.videoId ||
      typeof player.getPlayerState !== "function"
    ) {
      return;
    }

    suppressUntilRef.current = Date.now() + 900;

    const targetTime = Number(state.currentTime || 0);
    const localTime =
      typeof player.getCurrentTime === "function"
        ? player.getCurrentTime()
        : 0;

    if (Math.abs(localTime - targetTime) > 0.5) {
      player.seekTo(targetTime, true);
    }

    if (state.playState === "PLAYING") {
      player.playVideo();
    } else {
      player.pauseVideo();
    }

    lastObservedTimeRef.current = targetTime;
    lastObservedAtRef.current = Date.now();
  };

  const emitSeek = (time) => {
    const now = Date.now();
    const {
      canControl: currentCanControl,
      onSeek: currentOnSeek,
    } = handlersRef.current;

    if (!currentCanControl) {
      currentOnSeek?.(time);
      restoreAuthoritativeState();
      return;
    }

    if (now - lastSeekAtRef.current < 250) {
      return;
    }

    lastSeekAtRef.current = now;
    currentOnSeek?.(time);
  };

  useEffect(() => {
    if (!videoId) {
      return undefined;
    }

    let mounted = true;
    mountedRef.current = true;

    loadYouTubeApi()
      .then(() => {
        if (!mounted || !containerRef.current) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = null;

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              restoreAuthoritativeState();
            },

            onStateChange: (event) => {
              if (
                !mountedRef.current ||
                Date.now() < suppressUntilRef.current
              ) {
                return;
              }

              const code = event.data;
              const current = event.target.getCurrentTime();

              lastObservedTimeRef.current = current;
              lastObservedAtRef.current = Date.now();

              if (code === window.YT.PlayerState.PLAYING) {
                const {
                  canControl: currentCanControl,
                  onPlay: currentOnPlay,
                } = handlersRef.current;

                currentOnPlay?.(current);

                if (!currentCanControl) {
                  restoreAuthoritativeState();
                }
              }

              if (code === window.YT.PlayerState.PAUSED) {
                if (pauseTimerRef.current) {
                  window.clearTimeout(pauseTimerRef.current);
                }

                const pausedAt = current;

                pauseTimerRef.current = window.setTimeout(() => {
                  pauseTimerRef.current = null;
                  const player = playerRef.current;

                  if (
                    !player ||
                    Date.now() - lastSeekAtRef.current < 650
                  ) {
                    return;
                  }

                  if (
                    typeof player.getPlayerState === "function" &&
                    player.getPlayerState() !== window.YT.PlayerState.PAUSED
                  ) {
                    return;
                  }

                  const latestTime =
                    typeof player.getCurrentTime === "function"
                      ? player.getCurrentTime()
                      : pausedAt;

                  if (Math.abs(latestTime - pausedAt) > 0.75) {
                    return;
                  }

                  const {
                    canControl: currentCanControl,
                    onPause: currentOnPause,
                  } = handlersRef.current;

                  currentOnPause?.(latestTime);

                  if (!currentCanControl) {
                    restoreAuthoritativeState();
                  }
                }, 260);
              }
            },
          },
        });

        pollTimerRef.current = window.setInterval(() => {
          const player = playerRef.current;

          if (!player || typeof player.getCurrentTime !== "function") {
            return;
          }

          if (Date.now() < suppressUntilRef.current) {
            return;
          }

          const current = Number(player.getCurrentTime() || 0);
          const now = Date.now();
          const previous = lastObservedTimeRef.current;
          const previousAt = lastObservedAtRef.current;
          const playerState =
            typeof player.getPlayerState === "function"
              ? player.getPlayerState()
              : -1;

          lastObservedTimeRef.current = current;
          lastObservedAtRef.current = now;

          if (previous === null || previousAt === null) {
            return;
          }

          const elapsedSeconds = Math.max(0, (now - previousAt) / 1000);
          const delta = current - previous;
          const normalProgress =
            playerState === window.YT.PlayerState.PLAYING
              ? elapsedSeconds
              : 0;
          const unexpectedJump = Math.abs(delta - normalProgress) > 1.35;

          if (!unexpectedJump) {
            return;
          }

          lastSeekAtRef.current = now;
          emitSeek(current);
        }, 200);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      mountedRef.current = false;

      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      if (pauseTimerRef.current) {
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }

      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current || !videoId) {
      return;
    }

    if (!serverTime) {
      return;
    }

    restoreAuthoritativeState();
  }, [videoId, playState, serverTime]);

  return (
    <div className="player-shell">
      {videoId ? (
        <div className="youtube-frame-wrap">
          <div ref={containerRef} className="youtube-frame" />
        </div>
      ) : (
        <div className="player-empty">
          <div className="play-orb">▶</div>
          <h3>Add a YouTube video</h3>
          <p>The host or moderator can paste a YouTube URL above.</p>
        </div>
      )}
    </div>
  );
}
