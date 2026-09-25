import express from "express";

import roomRoutes from "./routes/roomRoutes.js";

const router = express.Router();


// All room-related APIs start with /rooms.
router.use(
  "/rooms",
  roomRoutes
);


export default router;