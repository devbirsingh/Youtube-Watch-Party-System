const registerRoomEvents = require("./roomSocket");

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    registerRoomEvents(io, socket);
  });
};

module.exports = initializeSocket;
