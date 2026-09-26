import React from "react";
import { useState } from "react";

export default function VideoToolbar({
  canControl,
  onChangeVideo,
  currentVideoId,
}) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    onChangeVideo(value.trim());
    setValue("");
  };

  return (
    <div className="video-toolbar">
      <form className="video-url-form" onSubmit={submit}>
        <span className="url-prefix">YouTube</span>

        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            currentVideoId
              ? "Paste another YouTube URL"
              : "Paste a YouTube URL"
          }
        />

        <button type="submit" disabled={!value.trim()}>
          {canControl ? "Change video" : "Request change"}
        </button>
      </form>

      {!canControl && (
        <div className="permission-hint">
          Playback actions from Participants require Host or Moderator approval.
        </div>
      )}
    </div>
  );
}
