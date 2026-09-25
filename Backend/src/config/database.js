import mongoose from "mongoose";
import env from "./env.js";

const connectDatabase = async () => {
  try {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    await mongoose.connect(env.databaseUrl);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    // Stop application if database connection fails.
    process.exit(1);
  }
};

export default connectDatabase;