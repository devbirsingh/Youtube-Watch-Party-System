// Extract YouTube video ID from common YouTube URLs.
//
// Supported examples:
//
// https://www.youtube.com/watch?v=dQw4w9WgXcQ
// https://youtu.be/dQw4w9WgXcQ
// https://www.youtube.com/embed/dQw4w9WgXcQ
//
// We store only the video ID in MongoDB.

export const extractYoutubeVideoId = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();

  // If the frontend already sends a video ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);

    // youtube.com/watch?v=VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.searchParams.get("v")
    ) {
      const videoId = parsedUrl.searchParams.get("v");

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }

    // youtu.be/VIDEO_ID
    if (parsedUrl.hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.substring(1);

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }

    // youtube.com/embed/VIDEO_ID
    if (parsedUrl.pathname.startsWith("/embed/")) {
      const videoId = parsedUrl.pathname.split("/")[2];

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }

    return null;
  } catch {
    return null;
  }
};