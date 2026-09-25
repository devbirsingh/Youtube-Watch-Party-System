import {
  SOCKET_EVENTS,
} from "../../constants/socketEvents.js";

import {
  updatePlaybackService,
} from "../../services/playbackService.js";


// =====================================================
// PLAY
// =====================================================

export const handlePlay = async (
  socket,
  io,
  data
) => {
  try {
    const room =
      await updatePlaybackService({
        roomCode:
          socket.roomCode,

        userId:
          socket.userId,

        action: "PLAY",

        time:
          typeof data?.time === "number"
            ? data.time
            : 0,
      });


    // Broadcast updated state to everyone.
    io.to(socket.roomCode).emit(
      SOCKET_EVENTS.SYNC_STATE,
      {
        roomCode:
          socket.roomCode,

        playback:
          room.playback,
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
// PAUSE
// =====================================================

export const handlePause = async (
  socket,
  io,
  data
) => {
  try {
    const room =
      await updatePlaybackService({
        roomCode:
          socket.roomCode,

        userId:
          socket.userId,

        action: "PAUSE",

        time:
          typeof data?.time === "number"
            ? data.time
            : 0,
      });


    io.to(socket.roomCode).emit(
      SOCKET_EVENTS.SYNC_STATE,
      {
        roomCode:
          socket.roomCode,

        playback:
          room.playback,
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
// SEEK
// =====================================================

export const handleSeek = async (
  socket,
  io,
  data
) => {
  try {
    const room =
      await updatePlaybackService({
        roomCode:
          socket.roomCode,

        userId:
          socket.userId,

        action: "SEEK",

        time:
          data?.time,
      });


    io.to(socket.roomCode).emit(
      SOCKET_EVENTS.SYNC_STATE,
      {
        roomCode:
          socket.roomCode,

        playback:
          room.playback,
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
// CHANGE VIDEO
// =====================================================

export const handleChangeVideo = async (
  socket,
  io,
  data
) => {
  try {
    const room =
      await updatePlaybackService({
        roomCode:
          socket.roomCode,

        userId:
          socket.userId,

        action:
          "CHANGE_VIDEO",

        videoId:
          data?.videoId,

        videoUrl:
          data?.videoUrl,
      });


    io.to(socket.roomCode).emit(
      SOCKET_EVENTS.SYNC_STATE,
      {
        roomCode:
          socket.roomCode,

        playback:
          room.playback,
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