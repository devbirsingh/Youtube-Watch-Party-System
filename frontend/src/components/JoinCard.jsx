import React from "react";
import { useState } from "react";
import { getOrCreateUserId } from "../utils/user";

export default function JoinCard({ user, onEnterRoom }) {
  const [username, setUsername] = useState(user?.username || "");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();

    if (!username.trim()) {
      return setError("Enter your name");
    }

    if (!roomId.trim()) {
      return setError("Enter a room code");
    }

    setError("");

    onEnterRoom(roomId.trim(), {
      userId: user?.userId || getOrCreateUserId(),
      username: username.trim(),
    });
  };

  return (
    <form className="join-card" onSubmit={submit}>
      <div className="eyebrow">JOIN A PARTY</div>
      <h2>Already have a room?</h2>
      <p>
        Enter the code shared by your host and start watching together.
      </p>

      <label>
        Your name
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. Dev"
          maxLength={30}
        />
      </label>

      <label>
        Room code
        <input
          value={roomId}
          onChange={(event) => setRoomId(event.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
        />
      </label>

      {error && <div className="form-error">{error}</div>}

      <button className="primary-button" type="submit">
        Join room
      </button>
    </form>
  );
}
