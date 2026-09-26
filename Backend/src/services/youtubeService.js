const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const extractYouTubeVideoId = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("A YouTube URL or video ID is required");
  }

  const value = input.trim();

  if (VIDEO_ID_PATTERN.test(value)) {
    return value;
  }

  let url;

  try {
    url = new URL(value);
  } catch (error) {
    throw new Error("Invalid YouTube URL");
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = "";

  if (hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  }

  if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(hostname)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] || "";
    } else if (url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] || "";
    }
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error("Invalid YouTube video URL");
  }

  return videoId;
};

module.exports = {
  extractYouTubeVideoId,
};
