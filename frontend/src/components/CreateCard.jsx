import React from "react";
import { useState } from "react";
import { createRoom } from "../api/roomApi";
import { getOrCreateUserId } from "../utils/user";

export default function CreateCard({ user, onEnterRoom }) {
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!username.trim()) {
      return setError("Enter your name");
    }

    setLoading(true);
    setError("");

    try {
      const nextUserId = user?.userId || getOrCreateUserId();
      const data = await createRoom(username.trim(), nextUserId);

      onEnterRoom(data.room.roomId, {
        userId: data.userId,
        username: username.trim(),
        role: data.role,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-card" onSubmit={submit}>
      <div className="eyebrow">HOST A WATCH PARTY</div>
      <h1>
        Watch YouTube
        <br />
        together, in sync.
      </h1>
      <p>
        Create a room, invite friends, and keep playback synchronized in real
        time.
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

      {error && <div className="form-error">{error}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create watch party"}
      </button>
    </form>
  );
}
