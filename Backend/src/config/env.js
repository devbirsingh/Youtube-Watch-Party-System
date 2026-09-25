import dotenv from "dotenv";

// Load variables from .env
dotenv.config();

// Keep all environment variables in one place.
// This prevents process.env from being scattered throughout the project.
const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 5000,

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  databaseUrl: process.env.DATABASE_URL,
};

export default env;