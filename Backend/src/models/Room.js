import mongoose from "mongoose";
import participantSchema from "./Participant.js";


// =====================================================
// PLAYBACK STATE
// =====================================================

const playbackStateSchema = new mongoose.Schema(
  {
    // YouTube video ID, not the complete YouTube URL.
    // Example: dQw4w9WgXcQ
    videoId: {
      type: String,
      default: null,
      trim: true,
    },

    playState: {
      type: String,

      enum: [
        "PLAYING",
        "PAUSED",
      ],

      default: "PAUSED",
    },

    // Current position of video in seconds.
    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Useful for knowing when state was changed.
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    _id: false,
  }
);


// =====================================================
// ROOM
// =====================================================

const roomSchema = new mongoose.Schema(
  {
    // Six-character code users can use to join.
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },

    // User who owns the room.
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // All users currently belonging to the room.
    participants: {
      type: [participantSchema],
      default: [],
    },

    // Current synchronized YouTube state.
    playback: {
      type: playbackStateSchema,

      default: () => ({
        videoId: null,
        playState: "PAUSED",
        currentTime: 0,
        updatedAt: new Date(),
      }),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;