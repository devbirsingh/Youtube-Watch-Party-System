import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SocketProvider, useSocket } from "../context/SocketContext";
import { useRoomSocket } from "../hooks/useRoomSocket";
import RoomHeader from "../components/RoomHeader";
import RoomSidebar from "../components/RoomSidebar";
import YouTubePlayer from "../components/YouTubePlayer";
import VideoToolbar from "../components/VideoToolbar";

export default function RoomPage({ roomId, user, onLeave }) {
  return (
    <SocketProvider roomId={roomId} user={user}>
      <RoomPageInner roomId={roomId} user={user} onLeave={onLeave} />
    </SocketProvider>
  );
}

function RoomPageInner({ roomId, user, onLeave }) {
  const { socket, connected } = useSocket();
  const removed = useCallback(() => onLeave(), [onLeave]);
  const room = useRoomSocket({
    socket,
    roomId,
    user,
    onRemoved: removed,
  });
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, []);

  const effectiveCurrentTime = useMemo(() => {
    if (room.syncState.playState !== "PLAYING") {
      return room.syncState.currentTime;
    }

    const elapsed = Math.max(
      0,
      (clock - Number(room.syncState.serverTime || clock)) / 1000
    );

    return room.syncState.currentTime + elapsed;
  }, [room.syncState, clock]);

  const canControl = room.role === "HOST" || room.role === "MODERATOR";
  const canApprove = canControl;

  const leave = () => {
    socket?.emit("leave_room", { roomId });
    onLeave();
  };

  const updateRole = (userId, role) =>
    socket?.emit("assign_role", { roomId, userId, role });

  const removeParticipant = (userId) =>
    socket?.emit("remove_participant", { roomId, userId });

  const transferHost = (userId) =>
    socket?.emit("transfer_host", { roomId, userId });

  const resolveRequest = (requestId, approved) =>
    socket?.emit("resolve_action_request", {
      roomId,
      requestId,
      approved,
    });

  const sendMessage = (message) =>
    socket?.emit("send_message", { roomId, message });

  const playbackAction = (eventName, payload) => {
    if (!socket) {
      return;
    }

    if (canControl) {
      socket.emit(eventName, { roomId, ...payload });
    } else {
      socket.emit("request_action", {
        roomId,
        action: eventName.toUpperCase(),
        payload,
      });
    }
  };

  const changeVideo = (videoUrl) => {
    if (canControl) {
      socket?.emit("change_video", { roomId, videoUrl });
    } else {
      socket?.emit("request_action", {
        roomId,
        action: "CHANGE_VIDEO",
        payload: { videoUrl },
      });
    }
  };

  const requestSeek = (time) => playbackAction("seek", { time });
  const requestPlay = (currentTime) =>
    playbackAction("play", { currentTime });
  const requestPause = (currentTime) =>
    playbackAction("pause", { currentTime });

  return (
    <div className="app-shell room-shell">
      <RoomHeader
        roomId={roomId}
        role={room.role}
        connected={connected}
        onLeave={leave}
      />

      <main className="room-main">
        <section className="watch-column">
          <div className="room-title-row">
            <div>
              <span className="eyebrow">WATCH PARTY</span>
              <h1>Tonight’s room</h1>
            </div>

            <div className="sync-status">
              <span /> Playback synced
            </div>
          </div>

          <VideoToolbar
            canControl={canControl}
            onChangeVideo={changeVideo}
            currentVideoId={room.syncState.videoId}
          />

          <YouTubePlayer
            videoId={room.syncState.videoId}
            playState={room.syncState.playState}
            currentTime={effectiveCurrentTime}
            serverTime={room.syncState.serverTime}
            canControl={canControl}
            onPlay={requestPlay}
            onPause={requestPause}
            onSeek={requestSeek}
          />

          <div className="room-hint">
            {canControl
              ? "You control this room. Other participants follow your timeline."
              : room.role === "PARTICIPANT"
                ? "Playback changes from Participants are sent for approval."
                : ""}
          </div>

          {(room.error || room.notice) && (
            <div className={`toast ${room.error ? "toast-error" : ""}`}>
              {room.error || room.notice}
            </div>
          )}
        </section>

        <RoomSidebar
          state={{ ...room, role: room.role }}
          actions={{
            userId: user.userId,
            canApprove,
            assignRole: updateRole,
            removeParticipant,
            transferHost,
            resolveRequest,
            sendMessage,
          }}
        />
      </main>
    </div>
  );
}
