import {
  createRoomService,
  joinRoomService,
  findRoomByCode,
  assignRoleService,
  removeParticipantService,
} from "../services/roomService.js";

import { ROLES } from "../constants/roles.js";


// =====================================================
// CREATE ROOM
// POST /api/rooms
// =====================================================

export const createRoom = async (
  req,
  res,
  next
) => {
  try {
    const { username } = req.body;


    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }


    const result =
      await createRoomService(username);


    return res.status(201).json({
      success: true,
      message: "Room created successfully",

      data: {
        room: {
          id: result.room._id,
          roomCode: result.room.roomCode,
          playback: result.room.playback,
          participants:
            result.room.participants,
        },

        user: {
          id: result.user._id,
          username: result.user.username,
          role: ROLES.HOST,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET ROOM
// GET /api/rooms/:roomCode
// =====================================================

export const getRoom = async (
  req,
  res,
  next
) => {
  try {
    const room = await findRoomByCode(
      req.params.roomCode
    );


    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    return res.status(200).json({
      success: true,

      data: {
        room: {
          id: room._id,
          roomCode: room.roomCode,
          host: room.host,
          participants:
            room.participants,
          playback: room.playback,
          isActive: room.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// JOIN ROOM
// POST /api/rooms/:roomCode/join
// =====================================================

export const joinRoom = async (
  req,
  res,
  next
) => {
  try {
    const { username } = req.body;
    const { roomCode } = req.params;


    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }


    const result =
      await joinRoomService(
        roomCode,
        username
      );


    return res.status(200).json({
      success: true,
      message: "Joined room successfully",

      data: {
        room: {
          id: result.room._id,
          roomCode: result.room.roomCode,
          host: result.room.host,
          participants:
            result.room.participants,
          playback: result.room.playback,
        },

        user: {
          id: result.user._id,
          username: result.user.username,
          role: ROLES.PARTICIPANT,
        },
      },
    });
  } catch (error) {
    if (error.message === "ROOM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    if (
      error.message ===
      "USERNAME_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Username is already being used in this room",
      });
    }


    next(error);
  }
};


// =====================================================
// GET PARTICIPANTS
// GET /api/rooms/:roomCode/participants
// =====================================================

export const getParticipants = async (
  req,
  res,
  next
) => {
  try {
    const room = await findRoomByCode(
      req.params.roomCode
    );


    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    return res.status(200).json({
      success: true,

      data: {
        participants:
          room.participants,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// ASSIGN ROLE
// PATCH /api/rooms/:roomCode/participants/:userId/role
// =====================================================

export const assignRole = async (
  req,
  res,
  next
) => {
  try {
    const {
      roomCode,
      userId,
    } = req.params;

    const { role } = req.body;


    const allowedRoles = [
      ROLES.MODERATOR,
      ROLES.PARTICIPANT,
      ROLES.VIEWER,
    ];


    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }


    const result =
      await assignRoleService({
        roomCode,
        targetUserId: userId,
        newRole: role,
      });


    return res.status(200).json({
      success: true,
      message:
        "Participant role updated successfully",

      data: {
        participant:
          result.participant,
      },
    });
  } catch (error) {
    if (
      error.message ===
      "ROOM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    if (
      error.message ===
      "PARTICIPANT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }


    if (
      error.message ===
      "CANNOT_CHANGE_HOST_ROLE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Host role cannot be changed here",
      });
    }


    next(error);
  }
};


// =====================================================
// REMOVE PARTICIPANT
// DELETE /api/rooms/:roomCode/participants/:userId
// =====================================================

export const removeParticipant = async (
  req,
  res,
  next
) => {
  try {
    const {
      roomCode,
      userId,
    } = req.params;


    const result =
      await removeParticipantService({
        roomCode,
        targetUserId: userId,
      });


    return res.status(200).json({
      success: true,
      message:
        "Participant removed successfully",

      data: {
        removedParticipant:
          result.removedParticipant,

        participants:
          result.room.participants,
      },
    });
  } catch (error) {
    if (
      error.message ===
      "ROOM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    if (
      error.message ===
      "PARTICIPANT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }


    if (
      error.message ===
      "CANNOT_REMOVE_HOST"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Host cannot be removed",
      });
    }


    next(error);
  }
};