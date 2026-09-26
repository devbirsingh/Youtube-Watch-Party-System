const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

export const extractYouTubeVideoId = (input) => {
  if (!input) {
    return "";
  }

  const value = input.trim();

  if (YOUTUBE_ID.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || "";
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2] || "";
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
};
