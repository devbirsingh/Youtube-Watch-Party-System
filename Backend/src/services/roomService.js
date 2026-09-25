import mongoose from "mongoose";
import Room from "../models/Room.js";
import User from "../models/User.js";
import generateRoomCode from "../utils/generateRoomCode.js";
import { ROLES } from "../constants/roles.js";


// =====================================================
// FIND ROOM
// =====================================================

export const findRoomByCode = async (roomCode) => {
    const room = await Room.findOne({
        roomCode: roomCode.toUpperCase(),
        isActive: true,
    });

    return room;
};


// =====================================================
// CREATE ROOM
// =====================================================

export const createRoomService = async (username) => {
    // Create user first.
    const user = await User.create({
        username: username.trim(),
        isOnline: true,
    });

    // Make sure generated room code is unique.
    let roomCode;
    let existingRoom;

    do {
        roomCode = generateRoomCode();

        existingRoom = await Room.findOne({
            roomCode,
        });
    } while (existingRoom);


    // Creator automatically becomes Host.
    const room = await Room.create({
        roomCode,

        host: user._id,

        participants: [
            {
                user: user._id,
                username: user.username,
                role: ROLES.HOST,
                socketId: null,
                isConnected: true,
            },
        ],

        playback: {
            videoId: null,
            playState: "PAUSED",
            currentTime: 0,
            updatedAt: new Date(),
        },

        isActive: true,
    });


    return {
        room,
        user,
    };
};


// =====================================================
// JOIN ROOM
// =====================================================

export const joinRoomService = async (roomCode, username) => {
    const room = await findRoomByCode(roomCode);

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }


    // Prevent duplicate username in same room.
    const existingParticipant =
        room.participants.find(
            (participant) =>
                participant.username.toLowerCase() === username.trim().toLowerCase()
        );


    if (existingParticipant) {
        throw new Error("USERNAME_ALREADY_EXISTS");
    }


    // Create user.
    const user = await User.create({
        username: username.trim(),
        isOnline: true,
    });


    // Joiners are always Participant initially.
    room.participants.push({
        user: user._id,
        username: user.username,
        role: ROLES.PARTICIPANT,
        socketId: null,
        joinedAt: new Date(),
        isConnected: true,
    });


    await room.save();


    return {
        room,
        user,
    };
};


// =====================================================
// GET PARTICIPANT
// =====================================================

export const getParticipant = (room, userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }

    return room.participants.find(
        (participant) =>
            participant.user.toString() === userId.toString()
    );
};


// =====================================================
// CHECK ROLE
// =====================================================

export const hasRole = (participant,allowedRoles) => {
    if (!participant) {
        return false;
    }

    return allowedRoles.includes(participant.role);
};


// =====================================================
// ASSIGN ROLE
// =====================================================

export const assignRoleService = async ({
    roomCode,
    targetUserId,
    newRole,
}) => {
    const room = await findRoomByCode(roomCode);

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }


    const participant = getParticipant(
        room,
        targetUserId
    );


    if (!participant) {
        throw new Error("PARTICIPANT_NOT_FOUND");
    }


    // Host cannot be changed using normal role assignment.
    if (participant.role === ROLES.HOST) {
        throw new Error("CANNOT_CHANGE_HOST_ROLE");
    }


    participant.role = newRole;

    await room.save();


    return {
        room,
        participant,
    };
};


// =====================================================
// REMOVE PARTICIPANT
// =====================================================

export const removeParticipantService = async ({
    roomCode,
    targetUserId,
}) => {
    const room = await findRoomByCode(roomCode);

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }


    const participantIndex =
        room.participants.findIndex(
            (participant) =>
                participant.user.toString() ===
                targetUserId.toString()
        );


    if (participantIndex === -1) {
        throw new Error("PARTICIPANT_NOT_FOUND");
    }


    const participant =
        room.participants[participantIndex];


    // Host cannot be removed.
    if (participant.role === ROLES.HOST) {
        throw new Error("CANNOT_REMOVE_HOST");
    }


    // Save removed participant information
    // before removing it from array.
    const removedParticipant = {
        userId: participant.user,
        username: participant.username,
        role: participant.role,
        socketId: participant.socketId,
    };


    room.participants.splice(
        participantIndex,
        1
    );


    await room.save();


    // Mark User as offline.
    await User.findByIdAndUpdate(
        targetUserId,
        {
            isOnline: false,
            socketId: null,
        }
    );


    return {
        room,
        removedParticipant,
    };
};


// =====================================================
// UPDATE SOCKET
// =====================================================

export const updateParticipantSocket = async ({
    roomCode,
    userId,
    socketId,
}) => {
    const room = await findRoomByCode(roomCode);

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }


    const participant = getParticipant(
        room,
        userId
    );


    if (!participant) {
        throw new Error("PARTICIPANT_NOT_FOUND");
    }


    participant.socketId = socketId;
    participant.isConnected = true;


    await room.save();


    await User.findByIdAndUpdate(
        userId,
        {
            socketId,
            isOnline: true,
        }
    );


    return room;
};


// =====================================================
// DISCONNECT PARTICIPANT
// =====================================================

export const disconnectParticipant = async ({
    roomCode,
    userId,
}) => {
    const room = await findRoomByCode(roomCode);

    if (!room) {
        return null;
    }


    const participant = getParticipant(
        room,
        userId
    );


    if (!participant) {
        return room;
    }


    participant.isConnected = false;
    participant.socketId = null;


    await room.save();


    await User.findByIdAndUpdate(
        userId,
        {
            isOnline: false,
            socketId: null,
        }
    );


    return room;
};