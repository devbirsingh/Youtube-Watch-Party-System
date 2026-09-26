const crypto = require("crypto");
const Room = require("../models/Room");
const generateRoomId = require("../utils/generateRoomId");
const {
  ROLES,
  canControlPlayback,
  canManageRoles,
  canManageParticipants,
  canApproveRequests,
} = require("../utils/permissions");
const { extractYouTubeVideoId } = require("./youtubeService");

const normalizeRoomId = (roomId) => String(roomId || "").trim().toUpperCase();

const normalizeUsername = (username) => {
  if (typeof username !== "string") {
    throw new Error("Username is required");
  }

  const value = username.trim();

  if (!value) {
    throw new Error("Username is required");
  }

  if (value.length > 30) {
    throw new Error("Username must be 30 characters or less");
  }

  return value;
};

const normalizeUserId = (userId) =>
  typeof userId === "string" && userId.trim()
    ? userId.trim()
    : crypto.randomUUID();

const normalizeTime = (time) => {
  const value = Number(time);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Current time must be a valid non-negative number");
  }

  return value;
};

const getRequiredRoom = async (roomId) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const room = await Room.findOne({ roomId: normalizedRoomId });

  if (!room) {
    throw new Error("Room not found");
  }

  return room;
};

const getParticipant = (room, userId) =>
  room.participants.find((participant) => participant.userId === userId);

const getRequiredParticipant = (room, userId) => {
  const participant = getParticipant(room, userId);

  if (!participant) {
    throw new Error("You are not a participant in this room");
  }

  return participant;
};

const getSyncedCurrentTime = (room) => {
  if (room.playState !== "PLAYING") {
    return Number(room.currentTime || 0);
  }

  const updatedAt = room.stateUpdatedAt
    ? new Date(room.stateUpdatedAt).getTime()
    : Date.now();
  const elapsed = Math.max(0, (Date.now() - updatedAt) / 1000);

  return Number(room.currentTime || 0) + elapsed;
};

const buildSyncState = (room) => ({
  playState: room.playState,
  currentTime: getSyncedCurrentTime(room),
  videoId: room.videoId,
  serverTime: Date.now(),
});

const getParticipants = (room) =>
  room.participants.map((participant) => ({
    userId: participant.userId,
    username: participant.username,
    role: participant.role,
  }));

const buildPublicRoom = (room) => ({
  roomId: room.roomId,
  hostId: room.hostId,
  participants: getParticipants(room),
  videoId: room.videoId,
  playState: room.playState,
  currentTime: getSyncedCurrentTime(room),
  messages: room.messages.map((message) => ({
    messageId: message.messageId,
    userId: message.userId,
    username: message.username,
    message: message.message,
    createdAt: message.createdAt,
  })),
});

const createRoom = async ({ username, userId }) => {
  const normalizedUsername = normalizeUsername(username);
  const normalizedUserId = normalizeUserId(userId);
  let room;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomId = generateRoomId();
    const exists = await Room.exists({ roomId });

    if (!exists) {
      room = new Room({
        roomId,
        hostId: normalizedUserId,
        participants: [
          {
            userId: normalizedUserId,
            username: normalizedUsername,
            role: ROLES.HOST,
          },
        ],
        videoId: null,
        playState: "PAUSED",
        currentTime: 0,
        stateUpdatedAt: new Date(),
      });
      break;
    }
  }

  if (!room) {
    throw new Error("Could not generate a unique room ID. Please try again");
  }

  await room.save();

  return {
    room: buildPublicRoom(room),
    userId: normalizedUserId,
    role: ROLES.HOST,
  };
};

const getPublicRoom = async (roomId) => {
  const room = await getRequiredRoom(roomId);
  return buildPublicRoom(room);
};

const getSyncState = async (roomId) => {
  const room = await getRequiredRoom(roomId);
  return buildSyncState(room);
};

const joinRoom = async ({ roomId, username, userId }) => {
  const room = await getRequiredRoom(roomId);
  const normalizedUsername = normalizeUsername(username);
  const normalizedUserId = normalizeUserId(userId);
  let participant = getParticipant(room, normalizedUserId);
  let isNew = false;

  if (participant) {
    participant.username = normalizedUsername;
  } else {
    let role = ROLES.PARTICIPANT;

    if (!room.hostId) {
      role = ROLES.HOST;
      room.hostId = normalizedUserId;
    } else if (room.hostId === normalizedUserId) {
      role = ROLES.HOST;
    }

    participant = {
      userId: normalizedUserId,
      username: normalizedUsername,
      role,
    };

    room.participants.push(participant);
    participant = getParticipant(room, normalizedUserId);
    isNew = true;
  }

  await room.save();

  return {
    room: buildPublicRoom(room),
    participant: {
      userId: participant.userId,
      username: participant.username,
      role: participant.role,
    },
    isNew,
    syncState: buildSyncState(room),
  };
};

const leaveRoom = async ({ roomId, userId }) => {
  const room = await getRequiredRoom(roomId);
  const participant = getRequiredParticipant(room, userId);
  const leftParticipant = {
    userId: participant.userId,
    username: participant.username,
    role: participant.role,
  };
  const wasHost = participant.role === ROLES.HOST;

  room.participants = room.participants.filter(
    (item) => item.userId !== userId
  );

  if (room.participants.length === 0) {
    await Room.deleteOne({ _id: room._id });

    return {
      roomDeleted: true,
      leftParticipant,
      room: null,
      newHost: null,
    };
  }

  let newHost = null;

  if (wasHost) {
    const nextHost = room.participants[0];
    nextHost.role = ROLES.HOST;
    room.hostId = nextHost.userId;
    newHost = {
      userId: nextHost.userId,
      username: nextHost.username,
      role: ROLES.HOST,
    };
  }

  await room.save();

  return {
    roomDeleted: false,
    leftParticipant,
    room: buildPublicRoom(room),
    newHost,
  };
};

const assertCanControl = (room, userId) => {
  const participant = getRequiredParticipant(room, userId);

  if (!canControlPlayback(participant.role)) {
    throw new Error("Only Host or Moderator can control playback");
  }

  return participant;
};

const savePlaybackState = async (room, playState, currentTime) => {
  room.playState = playState;
  room.currentTime = normalizeTime(currentTime);
  room.stateUpdatedAt = new Date();

  await room.save();

  return buildSyncState(room);
};

const play = async ({ roomId, userId, currentTime }) => {
  const room = await getRequiredRoom(roomId);
  assertCanControl(room, userId);
  const time =
    currentTime === undefined ? getSyncedCurrentTime(room) : currentTime;

  return savePlaybackState(room, "PLAYING", time);
};

const pause = async ({ roomId, userId, currentTime }) => {
  const room = await getRequiredRoom(roomId);
  assertCanControl(room, userId);
  const time =
    currentTime === undefined ? getSyncedCurrentTime(room) : currentTime;

  return savePlaybackState(room, "PAUSED", time);
};

const seek = async ({ roomId, userId, time }) => {
  const room = await getRequiredRoom(roomId);
  assertCanControl(room, userId);

  return savePlaybackState(room, room.playState, time);
};

const changeVideo = async ({ roomId, userId, videoUrl, videoId }) => {
  const room = await getRequiredRoom(roomId);
  assertCanControl(room, userId);
  const normalizedVideoId = extractYouTubeVideoId(videoId || videoUrl);

  room.videoId = normalizedVideoId;
  room.playState = "PAUSED";
  room.currentTime = 0;
  room.stateUpdatedAt = new Date();

  await room.save();

  return buildSyncState(room);
};

const assignRole = async ({ roomId, actorId, userId, role }) => {
  const room = await getRequiredRoom(roomId);
  const actor = getRequiredParticipant(room, actorId);

  if (!canManageRoles(actor.role)) {
    throw new Error("Only Host can assign roles");
  }

  const normalizedRole = String(role || "").trim().toUpperCase();

  if (![ROLES.MODERATOR, ROLES.PARTICIPANT].includes(normalizedRole)) {
    throw new Error("Role must be MODERATOR or PARTICIPANT");
  }

  const target = getRequiredParticipant(room, userId);

  if (target.role === ROLES.HOST) {
    throw new Error("Host role can only be changed through host transfer");
  }

  target.role = normalizedRole;

  await room.save();

  return {
    userId: target.userId,
    username: target.username,
    role: target.role,
    participants: getParticipants(room),
    hostId: room.hostId,
  };
};

const removeParticipant = async ({ roomId, actorId, userId }) => {
  const room = await getRequiredRoom(roomId);
  const actor = getRequiredParticipant(room, actorId);

  if (!canManageParticipants(actor.role)) {
    throw new Error("Only Host can remove participants");
  }

  const target = getRequiredParticipant(room, userId);

  if (target.role === ROLES.HOST) {
    throw new Error("Host cannot remove the Host");
  }

  const removedParticipant = {
    userId: target.userId,
    username: target.username,
    role: target.role,
  };

  room.participants = room.participants.filter(
    (participant) => participant.userId !== userId
  );

  room.pendingRequests = room.pendingRequests.filter(
    (request) => request.userId !== userId || request.status !== "PENDING"
  );

  await room.save();

  return {
    removedParticipant,
    participants: getParticipants(room),
    hostId: room.hostId,
  };
};

const transferHost = async ({ roomId, actorId, userId }) => {
  const room = await getRequiredRoom(roomId);
  const actor = getRequiredParticipant(room, actorId);

  if (!canManageRoles(actor.role) || actor.role !== ROLES.HOST) {
    throw new Error("Only Host can transfer Host role");
  }

  const target = getRequiredParticipant(room, userId);

  if (target.userId === actorId) {
    throw new Error("You are already the Host");
  }

  actor.role = ROLES.MODERATOR;
  target.role = ROLES.HOST;
  room.hostId = target.userId;

  await room.save();

  return {
    host: {
      userId: target.userId,
      username: target.username,
      role: target.role,
    },
    participants: getParticipants(room),
    hostId: room.hostId,
  };
};

const createActionRequest = async ({ roomId, userId, action, payload }) => {
  const room = await getRequiredRoom(roomId);
  const requester = getRequiredParticipant(room, userId);

  if (requester.role !== ROLES.PARTICIPANT) {
    throw new Error("Only Participants need approval for playback changes");
  }

  const normalizedAction = String(action || "").trim().toUpperCase();
  const normalizedPayload =
    payload && typeof payload === "object" ? { ...payload } : {};

  if (!["PLAY", "PAUSE", "SEEK", "CHANGE_VIDEO"].includes(normalizedAction)) {
    throw new Error("Invalid action request");
  }

  if (normalizedAction === "SEEK") {
    normalizedPayload.time = normalizeTime(normalizedPayload.time);
  }

  if (normalizedAction === "PLAY" || normalizedAction === "PAUSE") {
    normalizedPayload.time = normalizeTime(
      normalizedPayload.time ?? getSyncedCurrentTime(room)
    );
  }

  if (normalizedAction === "CHANGE_VIDEO") {
    normalizedPayload.videoId = extractYouTubeVideoId(
      normalizedPayload.videoId || normalizedPayload.videoUrl
    );
    delete normalizedPayload.videoUrl;
  }

  const request = {
    requestId: crypto.randomUUID(),
    userId: requester.userId,
    username: requester.username,
    action: normalizedAction,
    payload: normalizedPayload,
    status: "PENDING",
    createdAt: new Date(),
  };

  room.pendingRequests.push(request);
  await room.save();

  return request;
};

const resolveActionRequest = async ({
  roomId,
  actorId,
  requestId,
  approved,
}) => {
  const room = await getRequiredRoom(roomId);
  const actor = getRequiredParticipant(room, actorId);

  if (!canApproveRequests(actor.role)) {
    throw new Error("Only Host or Moderator can approve requests");
  }

  const request = room.pendingRequests.find(
    (item) => item.requestId === requestId
  );

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request has already been resolved");
  }

  if (!approved) {
    request.status = "REJECTED";
    request.resolvedBy = actorId;
    request.resolvedAt = new Date();

    await room.save();

    return {
      request,
      syncState: buildSyncState(room),
    };
  }

  const requester = getParticipant(room, request.userId);

  if (!requester) {
    throw new Error("Requesting participant is no longer in the room");
  }

  if (request.action === "PLAY") {
    room.playState = "PLAYING";
    room.currentTime = normalizeTime(
      request.payload.time ?? getSyncedCurrentTime(room)
    );
  }

  if (request.action === "PAUSE") {
    room.playState = "PAUSED";
    room.currentTime = normalizeTime(
      request.payload.time ?? getSyncedCurrentTime(room)
    );
  }

  if (request.action === "SEEK") {
    room.currentTime = normalizeTime(request.payload.time);
  }

  if (request.action === "CHANGE_VIDEO") {
    room.videoId = extractYouTubeVideoId(request.payload.videoId);
    room.playState = "PAUSED";
    room.currentTime = 0;
  }

  room.stateUpdatedAt = new Date();
  request.status = "APPROVED";
  request.resolvedBy = actorId;
  request.resolvedAt = new Date();

  await room.save();

  return {
    request,
    syncState: buildSyncState(room),
  };
};

const sendChatMessage = async ({ roomId, userId, message }) => {
  const room = await getRequiredRoom(roomId);
  const participant = getRequiredParticipant(room, userId);

  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const cleanMessage = message.trim();

  if (cleanMessage.length > 500) {
    throw new Error("Message must be 500 characters or less");
  }

  const chatMessage = {
    messageId: crypto.randomUUID(),
    userId: participant.userId,
    username: participant.username,
    message: cleanMessage,
    createdAt: new Date(),
  };

  room.messages.push(chatMessage);

  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100);
  }

  await room.save();

  return chatMessage;
};

module.exports = {
  createRoom,
  getPublicRoom,
  getSyncState,
  joinRoom,
  leaveRoom,
  play,
  pause,
  seek,
  changeVideo,
  assignRole,
  removeParticipant,
  transferHost,
  createActionRequest,
  resolveActionRequest,
  sendChatMessage,
};
