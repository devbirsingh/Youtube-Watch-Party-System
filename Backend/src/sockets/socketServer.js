import {
  Server,
} from "socket.io";

import env from "../config/env.js";

import {
  SOCKET_EVENTS,
} from "../constants/socketEvents.js";

import {
  socketRoomMiddleware,
} from "./socketMiddleware.js";

import {
  handleJoinRoom,
  handleLeaveRoom,
  handleRemoveParticipant,
  handleDisconnect,
} from "./handlers/roomHandler.js";

import {
  handlePlay,
  handlePause,
  handleSeek,
  handleChangeVideo,
} from "./handlers/playbackHandler.js";

import {
  handleAssignRole,
} from "./handlers/roleHandler.js";


// =====================================================
// CREATE SOCKET SERVER
// =====================================================

export const createSocketServer = (
  httpServer
) => {
  const io = new Server(
    httpServer,
    {
      cors: {
        origin:
          env.clientUrl,

        methods: [
          "GET",
          "POST",
        ],
      },
    }
  );


  // Check room/user before connection.
  io.use(
    socketRoomMiddleware
  );


  // New Socket.IO connection.
  io.on(
    "connection",
    (socket) => {
      console.log(
        `Socket connected: ${socket.id}`
      );


      // -------------------------------
      // ROOM
      // -------------------------------

      socket.on(
        SOCKET_EVENTS.JOIN_ROOM,
        () =>
          handleJoinRoom(
            socket,
            io
          )
      );


      socket.on(
        SOCKET_EVENTS.LEAVE_ROOM,
        () =>
          handleLeaveRoom(
            socket,
            io
          )
      );


      socket.on(
        SOCKET_EVENTS.REMOVE_PARTICIPANT,
        (data) =>
          handleRemoveParticipant(
            socket,
            io,
            data
          )
      );


      // -------------------------------
      // PLAYBACK
      // -------------------------------

      socket.on(
        SOCKET_EVENTS.PLAY,
        (data) =>
          handlePlay(
            socket,
            io,
            data
          )
      );


      socket.on(
        SOCKET_EVENTS.PAUSE,
        (data) =>
          handlePause(
            socket,
            io,
            data
          )
      );


      socket.on(
        SOCKET_EVENTS.SEEK,
        (data) =>
          handleSeek(
            socket,
            io,
            data
          )
      );


      socket.on(
        SOCKET_EVENTS.CHANGE_VIDEO,
        (data) =>
          handleChangeVideo(
            socket,
            io,
            data
          )
      );


      // -------------------------------
      // ROLES
      // -------------------------------

      socket.on(
        SOCKET_EVENTS.ASSIGN_ROLE,
        (data) =>
          handleAssignRole(
            socket,
            io,
            data
          )
      );


      // -------------------------------
      // DISCONNECT
      // -------------------------------

      socket.on(
        "disconnect",
        () =>
          handleDisconnect(
            socket,
            io
          )
      );
    }
  );


  return io;
};