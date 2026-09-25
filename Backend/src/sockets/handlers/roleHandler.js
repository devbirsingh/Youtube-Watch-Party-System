import {
  SOCKET_EVENTS,
} from "../../constants/socketEvents.js";

import {
  findRoomByCode,
  getParticipant,
  assignRoleService,
} from "../../services/roomService.js";

import {
  ROLES,
} from "../../constants/roles.js";


// =====================================================
// ASSIGN ROLE
// =====================================================

export const handleAssignRole = async (
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

    const role =
      data?.role;


    if (!targetUserId || !role) {
      return socket.emit(
        SOCKET_EVENTS.ERROR,
        {
          message:
            "userId and role are required",
        }
      );
    }


    // Only these roles can be assigned.
    const allowedRoles = [
      ROLES.MODERATOR,
      ROLES.PARTICIPANT,
      ROLES.VIEWER,
    ];


    if (
      !allowedRoles.includes(role)
    ) {
      return socket.emit(
        SOCKET_EVENTS.ERROR,
        {
          message:
            "Invalid role",
        }
      );
    }


    // Fetch fresh room data.
    const room =
      await findRoomByCode(roomCode);


    // Find the user who is making request.
    const host =
      getParticipant(
        room,
        hostUserId
      );


    // IMPORTANT:
    // Backend checks the role.
    // Frontend cannot fake being Host.
    if (
      !host ||
      host.role !== ROLES.HOST
    ) {
      return socket.emit(
        SOCKET_EVENTS.ERROR,
        {
          message:
            "Only Host can assign roles",
        }
      );
    }


    const result =
      await assignRoleService({
        roomCode,
        targetUserId,
        newRole: role,
      });


    io.to(roomCode).emit(
      SOCKET_EVENTS.ROLE_ASSIGNED,
      {
        userId:
          result.participant.user,

        username:
          result.participant.username,

        role:
          result.participant.role,

        participants:
          result.room.participants,
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