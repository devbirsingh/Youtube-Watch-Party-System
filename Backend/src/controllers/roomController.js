const roomService = require("../services/roomService");

const createRoom = async (req, res, next) => {
  try {
    const result = await roomService.createRoom({
      username: req.body.username,
      userId: req.body.userId,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getRoom = async (req, res, next) => {
  try {
    const room = await roomService.getPublicRoom(req.params.roomId);

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRoom,
};
