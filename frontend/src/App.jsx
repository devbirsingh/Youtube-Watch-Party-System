import React from "react";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";
import { getStoredUser, saveUser } from "./utils/user";

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [roomId, setRoomId] = useState(() => getRoomFromUrl());

  useEffect(() => {
    if (roomId) {
      window.history.replaceState({}, "", `/room/${roomId}`);
    } else {
      window.history.replaceState({}, "", "/");
    }
  }, [roomId]);

  const handleUser = (nextUser) => {
    saveUser(nextUser);
    setUser(nextUser);
  };

  const enterRoom = (nextRoomId, nextUser) => {
    handleUser(nextUser);
    setRoomId(nextRoomId.toUpperCase());
  };

  const leaveRoom = () => {
    setRoomId(null);
    window.history.replaceState({}, "", "/");
  };

  if (roomId) {
    return <RoomPage roomId={roomId} user={user} onLeave={leaveRoom} />;
  }

  return <HomePage user={user} onEnterRoom={enterRoom} />;
}

function getRoomFromUrl() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export default App;
