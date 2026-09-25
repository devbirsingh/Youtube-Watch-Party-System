import express from "express";

import {
  createRoom,
  getRoom,
  joinRoom,
  getParticipants,
  assignRole,
  removeParticipant,
} from "../controllers/roomController.js";

import {
  requireRoomRole,
} from "../middlewares/roleMiddleware.js";

import {
  ROLES,
} from "../constants/roles.js";

const router = express.Router();


// =====================================================
// ROOM ROUTES
// =====================================================

// Create a new room.
router.post(
  "/",
  createRoom
);


// Get room information.
router.get(
  "/:roomCode",
  getRoom
);


// Join room.
router.post(
  "/:roomCode/join",
  joinRoom
);


// Get participants.
router.get(
  "/:roomCode/participants",
  getParticipants
);


// Only Host can assign roles.
router.patch(
  "/:roomCode/participants/:userId/role",

  requireRoomRole([
    ROLES.HOST,
  ]),

  assignRole
);


// Only Host can remove participants.
router.delete(
  "/:roomCode/participants/:userId",

  requireRoomRole([
    ROLES.HOST,
  ]),

  removeParticipant
);


export default router;