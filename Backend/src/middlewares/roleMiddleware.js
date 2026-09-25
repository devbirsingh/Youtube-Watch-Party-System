import { findRoomByCode } from "../services/roomService.js";


// =====================================================
// REQUIRE ROLE
// =====================================================

export const requireRoomRole = (
  allowedRoles
) => {
  return async (req, res, next) => {
    try {
      const userId =
        req.headers["x-user-id"];

      const { roomCode } =
        req.params;


      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID is required",
        });
      }


      const room =
        await findRoomByCode(roomCode);


      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }


      const participant =
        room.participants.find(
          (item) =>
            item.user.toString() ===
            userId.toString()
        );


      if (!participant) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a participant in this room",
        });
      }


      if (
        !allowedRoles.includes(
          participant.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission for this action",
        });
      }


      // Save information for controller.
      req.room = room;
      req.participant = participant;


      next();
    } catch (error) {
      next(error);
    }
  };
};