import {
  SOCKET_EVENTS,
} from "../../constants/socketEvents.js";

import {
  findRoomByCode,
  updateParticipantSocket,
  disconnectParticipant,
  getParticipant,
  removeParticipantService,
  assignRoleService,
} from "../../services/roomService.js";

import {
  ROLES,
} from "../../constants/roles.js";


// =====================================================
// JOIN ROOM
// =====================================================

export const handleJoinRoom = async (
  socket,
  io
) => {
  try {
    const roomCode =
      socket.roomCode;

    const userId =
      socket.userId;


    // Join Socket.IO room.
    socket.join(roomCode);


    // Save socket ID in database.
    const room =
      await updateParticipantSocket({
        roomCode,
        userId,
        socketId: socket.id,
      });


    const participant =
      getParticipant(
        room,
        userId
      );


    // Send current room state to newly joined user.
    socket.emit(
      SOCKET_EVENTS.SYNC_STATE,
      {
        roomCode,
        playback: room.playback,
        participants:
          room.participants,
      }
    );


    // Tell everyone else.
    socket.to(roomCode).emit(
      SOCKET_EVENTS.USER_JOINED,
      {
        userId,
        username:
          participant.username,
        role:
          participant.role,
        participants:
          room.participants,
      }
    );
  } catch (error) {
    socket.emit(
      SOCKET_EVENTS.ERROR,
      {
        message:
          error.message,
      }
    );
  }
};


// =====================================================
// LEAVE ROOM
// =====================================================

export const handleLeaveRoom = async (
  socket,
  io
) => {
  try {
    const roomCode =
      socket.roomCode;

    const userId =
      socket.userId;


    const room =
      await disconnectParticipant({
        roomCode,
        userId,
      });


    socket.leave(roomCode);


    if (!room) {
      return;
    }


    const participant =
      getParticipant(
        room,
        userId
      );


    io.to(roomCode).emit(
      SOCKET_EVENTS.USER_LEFT,
      {
        userId,
        username:
          participant?.username || "User",
        participants:
          room.participants,
      }
    );
  } catch (error) {
    socket.emit(
      SOCKET_EVENTS.ERROR,
      {
        message:
          error.message,
      }
    );
  }
};


// =====================================================
// REMOVE PARTICIPANT
// =====================================================

export const handleRemoveParticipant = async (
  socket,
  io,
  data
) => {
  try {
    const roomCode =
      socket.roomCode;

    const hostUserId =
      socket.userId;

    const targetUserId =
      data?.userId;


    if (!targetUserId) {
      return socket.emit(
        SOCKET_EVENTS.ERROR,
        {
          message:
            "Target userId is required",
        }
      );
    }


    // IMPORTANT:
    // Never trust the frontend role.
    // Get the latest role from database.
    const room =
      await findRoomByCode(roomCode);


    const host =
      getParticipant(
        room,
        hostUserId
      );


    if (
      !host ||
      host.role !== ROLES.HOST
    ) {
      return socket.emit(
        SOCKET_EVENTS.ERROR,
        {
          message:
            "Only Host can remove participants",
        }
      );
    }


    const result =
      await removeParticipantService({
        roomCode,
        targetUserId,
      });


    io.to(roomCode).emit(
      SOCKET_EVENTS.PARTICIPANT_REMOVED,
      {
        userId:
          result.removedParticipant.userId,

        username:
          result.removedParticipant.username,

        participants:
          result.room.participants,
      }
    );


    // If removed user is currently connected,
    // force them out of Socket.IO room.
    if (
      result.removedParticipant.socketId
    ) {
      const targetSocket =
        io.sockets.sockets.get(
          result.removedParticipant.socketId
        );

      if (targetSocket) {
        targetSocket.leave(roomCode);

        targetSocket.emit(
          SOCKET_EVENTS.PARTICIPANT_REMOVED,
          {
            userId: targetUserId,
            removed: true,
            message:
              "You have been removed from the room",
          }
        );
      }
    }
  } catch (error) {
    socket.emit(
      SOCKET_EVENTS.ERROR,
      {
        message:
          error.message,
      }
    );
  }
};


// =====================================================
// DISCONNECT
// =====================================================

export const handleDisconnect = async (
  socket,
  io
) => {
  try {
    const roomCode =
      socket.roomCode;

    const userId =
      socket.userId;


    if (!roomCode || !userId) {
      return;
    }


    const room =
      await disconnectParticipant({
        roomCode,
        userId,
      });


    if (!room) {
      return;
    }


    const participant =
      getParticipant(
        room,
        userId
      );


    io.to(roomCode).emit(
      SOCKET_EVENTS.USER_LEFT,
      {
        userId,
        username:
          participant?.username || "User",
        participants:
          room.participants,
      }
    );
  } catch (error) {
    console.error(
      "Socket disconnect error:",
      error.message
    );
  }
};