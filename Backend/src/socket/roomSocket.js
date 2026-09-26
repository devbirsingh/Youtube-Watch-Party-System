const crypto = require("crypto");
const roomService = require("../services/roomService");
const { canApproveRequests } = require("../utils/permissions");

const normalizeRoomId = (roomId) => String(roomId || "").trim().toUpperCase();

const emitSocketError = (socket, error) => {
  socket.emit("socket_error", {
    message: error.message || "Socket action failed",
  });
};

const ensureJoinedRoom = (socket, roomId) => {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!socket.data.roomId || socket.data.roomId !== normalizedRoomId) {
    throw new Error("You are not connected to this room");
  }

  return normalizedRoomId;
};

const broadcastParticipants = async (io, roomId) => {
  const room = await roomService.getPublicRoom(roomId);

  io.to(roomId).emit("participants_updated", {
    participants: room.participants,
    hostId: room.hostId,
  });
};

const broadcastSyncState = async (io, roomId) => {
  const syncState = await roomService.getSyncState(roomId);
  io.to(roomId).emit("sync_state", syncState);
};

const findSocketsByUserId = async (io, roomId, userId) => {
  const sockets = await io.in(roomId).fetchSockets();
  return sockets.filter((client) => client.data.userId === userId);
};

const notifyApprovalRoles = async (io, roomId, event, data) => {
  const sockets = await io.in(roomId).fetchSockets();

  sockets
    .filter((client) => canApproveRequests(client.data.role))
    .forEach((client) => {
      client.emit(event, data);
    });
};

const leaveCurrentRoom = async (io, socket, isDisconnect) => {
  const roomId = socket.data.roomId;
  const userId = socket.data.userId;

  if (!roomId || !userId || socket.data.roomHandled) {
    return;
  }

  socket.data.roomHandled = true;

  try {
    const result = await roomService.leaveRoom({ roomId, userId });

    if (result.roomDeleted) {
      socket.data.roomId = null;
      return;
    }

    socket.to(roomId).emit("user_left", {
      username: result.leftParticipant.username,
      userId: result.leftParticipant.userId,
      participants: result.room.participants,
    });

    if (result.newHost) {
      io.to(roomId).emit("host_changed", {
        host: result.newHost,
        hostId: result.room.hostId,
      });
    }

    io.to(roomId).emit("participants_updated", {
      participants: result.room.participants,
      hostId: result.room.hostId,
    });
  } catch (error) {
    if (!isDisconnect) {
      emitSocketError(socket, error);
    }
  } finally {
    socket.data.roomId = null;
    socket.data.role = null;

    if (!isDisconnect) {
      socket.leave(roomId);
    }
  }
};

const registerRoomEvents = (io, socket) => {
  socket.on("join_room", async (data = {}) => {
    try {
      const roomId = normalizeRoomId(data.roomId);
      const username = data.username;
      const userId =
        typeof data.userId === "string" && data.userId.trim()
          ? data.userId.trim()
          : crypto.randomUUID();

      if (!roomId) {
        throw new Error("Room ID is required");
      }

      if (socket.data.roomId && socket.data.roomId !== roomId) {
        throw new Error("Leave your current room before joining another room");
      }

      const result = await roomService.joinRoom({
        roomId,
        username,
        userId,
      });

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = result.participant.userId;
      socket.data.username = result.participant.username;
      socket.data.role = result.participant.role;
      socket.data.roomHandled = false;

      socket.emit("joined_room", {
        roomId,
        userId: result.participant.userId,
        username: result.participant.username,
        role: result.participant.role,
        participants: result.room.participants,
      });

      socket.emit("sync_state", result.syncState);
      socket.emit("room_snapshot", result.room);

      if (result.isNew) {
        socket.to(roomId).emit("user_joined", {
          username: result.participant.username,
          userId: result.participant.userId,
          role: result.participant.role,
          participants: result.room.participants,
        });
      }

      io.to(roomId).emit("participants_updated", {
        participants: result.room.participants,
        hostId: result.room.hostId,
      });
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("leave_room", async (data = {}) => {
    try {
      ensureJoinedRoom(socket, data.roomId);
      await leaveCurrentRoom(io, socket, false);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("play", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      await roomService.play({
        roomId,
        userId: socket.data.userId,
        currentTime: data.currentTime,
      });

      await broadcastSyncState(io, roomId);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("pause", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      await roomService.pause({
        roomId,
        userId: socket.data.userId,
        currentTime: data.currentTime,
      });

      await broadcastSyncState(io, roomId);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("seek", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      await roomService.seek({
        roomId,
        userId: socket.data.userId,
        time: data.time,
      });

      await broadcastSyncState(io, roomId);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("change_video", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const syncState = await roomService.changeVideo({
        roomId,
        userId: socket.data.userId,
        videoUrl: data.videoUrl,
        videoId: data.videoId,
      });

      io.to(roomId).emit("video_changed", syncState);
      io.to(roomId).emit("sync_state", syncState);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("assign_role", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const result = await roomService.assignRole({
        roomId,
        actorId: socket.data.userId,
        userId: data.userId,
        role: data.role,
      });

      const targetSockets = await findSocketsByUserId(
        io,
        roomId,
        result.userId
      );

      targetSockets.forEach((targetSocket) => {
        targetSocket.data.role = result.role;
        targetSocket.emit("role_assigned", {
          userId: result.userId,
          username: result.username,
          role: result.role,
          participants: result.participants,
        });
      });

      io.to(roomId).emit("participants_updated", {
        participants: result.participants,
        hostId: result.hostId,
      });

      if (targetSockets.length === 0) {
        io.to(roomId).emit("role_assigned", {
          userId: result.userId,
          username: result.username,
          role: result.role,
          participants: result.participants,
        });
      }
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("remove_participant", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const result = await roomService.removeParticipant({
        roomId,
        actorId: socket.data.userId,
        userId: data.userId,
      });

      const targetSockets = await findSocketsByUserId(
        io,
        roomId,
        result.removedParticipant.userId
      );

      targetSockets.forEach((targetSocket) => {
        targetSocket.emit("removed_from_room", {
          userId: result.removedParticipant.userId,
        });
        targetSocket.emit("participant_removed", {
          userId: result.removedParticipant.userId,
          participants: result.participants,
        });
        targetSocket.data.roomId = null;
        targetSocket.data.role = null;
        targetSocket.leave(roomId);
      });

      io.to(roomId).emit("participant_removed", {
        userId: result.removedParticipant.userId,
        participants: result.participants,
      });

      io.to(roomId).emit("participants_updated", {
        participants: result.participants,
        hostId: result.hostId,
      });
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("transfer_host", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const result = await roomService.transferHost({
        roomId,
        actorId: socket.data.userId,
        userId: data.userId,
      });

      const allRoomSockets = await io.in(roomId).fetchSockets();

      allRoomSockets.forEach((roomSocket) => {
        const participant = result.participants.find(
          (item) => item.userId === roomSocket.data.userId
        );

        if (participant) {
          roomSocket.data.role = participant.role;
        }
      });

      io.to(roomId).emit("host_transferred", {
        host: result.host,
        hostId: result.hostId,
        participants: result.participants,
      });

      io.to(roomId).emit("participants_updated", {
        participants: result.participants,
        hostId: result.hostId,
      });
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("request_action", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const request = await roomService.createActionRequest({
        roomId,
        userId: socket.data.userId,
        action: data.action,
        payload: data.payload,
      });

      socket.emit("request_submitted", request);
      await notifyApprovalRoles(io, roomId, "action_requested", request);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("resolve_action_request", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const result = await roomService.resolveActionRequest({
        roomId,
        actorId: socket.data.userId,
        requestId: data.requestId,
        approved: Boolean(data.approved),
      });

      io.to(roomId).emit("request_resolved", result.request);

      if (result.request.status === "APPROVED") {
        io.to(roomId).emit("sync_state", result.syncState);

        if (result.request.action === "CHANGE_VIDEO") {
          io.to(roomId).emit("video_changed", result.syncState);
        }
      }
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("send_message", async (data = {}) => {
    try {
      const roomId = ensureJoinedRoom(socket, data.roomId);

      const message = await roomService.sendChatMessage({
        roomId,
        userId: socket.data.userId,
        message: data.message,
      });

      io.to(roomId).emit("chat_message", message);
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on("disconnecting", async () => {
    await leaveCurrentRoom(io, socket, true);
  });
};

module.exports = registerRoomEvents;
