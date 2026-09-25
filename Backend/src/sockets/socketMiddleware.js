import {
  findRoomByCode,
  getParticipant,
} from "../services/roomService.js";


// =====================================================
// SOCKET ROOM AUTHENTICATION
// =====================================================
//
// The client sends:
// {
//   roomCode: "ABC123",
//   userId: "..."
// }
//
// before connecting.
//
// We check that the user actually belongs
// to that room.
// =====================================================

export const socketRoomMiddleware = async (
  socket,
  next
) => {
  try {
    const {
      roomCode,
      userId,
    } = socket.handshake.auth;


    if (!roomCode || !userId) {
      return next(
        new Error(
          "roomCode and userId are required"
        )
      );
    }


    const room =
      await findRoomByCode(roomCode);


    if (!room) {
      return next(
        new Error(
          "Room does not exist"
        )
      );
    }


    const participant =
      getParticipant(
        room,
        userId
      );


    if (!participant) {
      return next(
        new Error(
          "User is not a participant in this room"
        )
      );
    }


    // Store useful data on socket.
    socket.roomCode =
      room.roomCode;

    socket.userId =
      userId;

    socket.participant =
      participant;


    next();
  } catch (error) {
    next(error);
  }
};