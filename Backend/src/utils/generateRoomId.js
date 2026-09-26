const crypto = require("crypto");

const generateRoomId = () => crypto.randomBytes(3).toString("hex").toUpperCase();

module.exports = generateRoomId;
