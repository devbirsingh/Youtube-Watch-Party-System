import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    // Reference to the actual User document.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // We keep username here so room participant data
    // can be returned without always populating User.
    username: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,

      enum: [
        "HOST",
        "MODERATOR",
        "PARTICIPANT",
        "VIEWER",
      ],

      default: "PARTICIPANT",
    },

    socketId: {
      type: String,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    isConnected: {
      type: Boolean,
      default: true,
    },
  },

  {
    _id: true,
  }
);

export default participantSchema;