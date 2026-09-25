import Room from "../models/Room.js";
import { extractYoutubeVideoId } from "../utils/youtube.js";
import { PLAYBACK_ROLES } from "../constants/roles.js";
import { getParticipant } from "./roomService.js";


// =====================================================
// CHECK PLAYBACK PERMISSION
// =====================================================

export const canControlPlayback = (
  room,
  userId
) => {
  const participant = getParticipant(
    room,
    userId
  );

  if (!participant) {
    return false;
  }

  return PLAYBACK_ROLES.includes(
    participant.role
  );
};


// =====================================================
// UPDATE PLAYBACK
// =====================================================

export const updatePlaybackService = async ({
  roomCode,
  userId,
  action,
  time,
  videoId,
  videoUrl,
}) => {
  const room = await Room.findOne({
    roomCode: roomCode.toUpperCase(),
    isActive: true,
  });


  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }


  // Backend permission check.
  if (!canControlPlayback(room, userId)) {
    throw new Error("PLAYBACK_PERMISSION_DENIED");
  }


  // PLAY
  if (action === "PLAY") {
    room.playback.playState = "PLAYING";

    if (typeof time === "number") {
      room.playback.currentTime = time;
    }
  }


  // PAUSE
  if (action === "PAUSE") {
    room.playback.playState = "PAUSED";

    if (typeof time === "number") {
      room.playback.currentTime = time;
    }
  }


  // SEEK
  if (action === "SEEK") {
    if (
      typeof time !== "number" ||
      time < 0
    ) {
      throw new Error("INVALID_SEEK_TIME");
    }

    room.playback.currentTime = time;
  }


  // CHANGE VIDEO
  if (action === "CHANGE_VIDEO") {
    let finalVideoId = videoId;

    // If frontend sends URL, extract ID.
    if (!finalVideoId && videoUrl) {
      finalVideoId =
        extractYoutubeVideoId(videoUrl);
    }


    if (!finalVideoId) {
      throw new Error(
        "INVALID_YOUTUBE_VIDEO"
      );
    }


    room.playback.videoId = finalVideoId;
    room.playback.currentTime = 0;
    room.playback.playState = "PAUSED";
  }


  room.playback.updatedAt = new Date();


  await room.save();


  return room;
};