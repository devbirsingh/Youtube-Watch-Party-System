import { useEffect, useState } from "react";

export function useRoomSocket({ socket, roomId, user, onRemoved }) {
  const [role, setRole] = useState(user?.role || "PARTICIPANT");
  const [participants, setParticipants] = useState([]);
  const [syncState, setSyncState] = useState({
    videoId: null,
    playState: "PAUSED",
    currentTime: 0,
    serverTime: Date.now(),
  });
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket || !roomId || !user?.userId) {
      return undefined;
    }

    const clearNoticeSoon = () =>
      window.setTimeout(() => setNotice(""), 2500);

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_room", {
        roomId,
        username: user.username,
        userId: user.userId,
      });
    };

    const onDisconnect = () => setConnected(false);

    const onJoined = (data) => {
      setRole(data.role);
      setParticipants(data.participants || []);
      setNotice(`Joined room ${data.roomId}`);
      clearNoticeSoon();
    };

    const onSnapshot = (data) => {
      setParticipants(data.participants || []);
      setMessages(data.messages || []);
    };

    const onSync = (data) => setSyncState(data);
    const onVideoChanged = (data) => setSyncState(data);
    const onParticipants = (data) =>
      setParticipants(data.participants || []);

    const onRoleAssigned = (data) => {
      setParticipants(data.participants || []);

      if (data.userId === user.userId) {
        setRole(data.role);
      }
    };

    const onHostTransferred = (data) => {
      setParticipants(data.participants || []);
      const me = data.participants?.find(
        (participant) => participant.userId === user.userId
      );

      if (me) {
        setRole(me.role);
      }
    };

    const onRequest = (data) =>
      setRequests((current) => [...current, data]);

    const onRequestSubmitted = (data) =>
      setRequests((current) => [
        ...current.filter((item) => item.requestId !== data.requestId),
        data,
      ]);

    const onRequestResolved = (data) =>
      setRequests((current) =>
        current
          .map((item) => (item.requestId === data.requestId ? data : item))
          .filter((item) => item.status === "PENDING")
      );

    const onChatMessage = (data) =>
      setMessages((current) => [
        ...current.filter((item) => item.messageId !== data.messageId),
        data,
      ].slice(-100));

    const onRemovedFromRoom = () => {
      onRemoved?.();
      setNotice("You were removed from the room");
    };

    const onSocketError = (data) => {
      setError(data?.message || "Something went wrong");
      window.setTimeout(() => setError(""), 3500);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("joined_room", onJoined);
    socket.on("room_snapshot", onSnapshot);
    socket.on("sync_state", onSync);
    socket.on("video_changed", onVideoChanged);
    socket.on("participants_updated", onParticipants);
    socket.on("role_assigned", onRoleAssigned);
    socket.on("host_transferred", onHostTransferred);
    socket.on("action_requested", onRequest);
    socket.on("request_submitted", onRequestSubmitted);
    socket.on("request_resolved", onRequestResolved);
    socket.on("chat_message", onChatMessage);
    socket.on("removed_from_room", onRemovedFromRoom);
    socket.on("socket_error", onSocketError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("joined_room", onJoined);
      socket.off("room_snapshot", onSnapshot);
      socket.off("sync_state", onSync);
      socket.off("video_changed", onVideoChanged);
      socket.off("participants_updated", onParticipants);
      socket.off("role_assigned", onRoleAssigned);
      socket.off("host_transferred", onHostTransferred);
      socket.off("action_requested", onRequest);
      socket.off("request_submitted", onRequestSubmitted);
      socket.off("request_resolved", onRequestResolved);
      socket.off("chat_message", onChatMessage);
      socket.off("removed_from_room", onRemovedFromRoom);
      socket.off("socket_error", onSocketError);
    };
  }, [socket, roomId, user?.userId, user?.username, onRemoved]);

  return {
    role,
    setRole,
    participants,
    syncState,
    setSyncState,
    requests,
    messages,
    error,
    notice,
    connected,
  };
}
