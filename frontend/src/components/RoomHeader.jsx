import React from "react";
import Logo from "./Logo";

export default function RoomHeader({ roomId, role, connected, onLeave }) {
  const copyRoomLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard?.writeText(link);
  };

  return (
    <header className="topbar room-topbar">
      <Logo />

      <div className="room-meta">
        <div className="room-code">
          ROOM <strong>{roomId}</strong>
        </div>

        <span className={`connection ${connected ? "online" : "offline"}`}>
          {connected ? "LIVE" : "OFFLINE"}
        </span>

        <span className="role-badge">{role}</span>

        <button className="ghost-button" onClick={copyRoomLink}>
          Copy link
        </button>

        <button className="danger-button" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}
