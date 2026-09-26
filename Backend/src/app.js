const express = require("express");
const cors = require("cors");
const roomRoutes = require("./routes/roomRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Watch Party backend is running",
  });
});

app.use("/api/rooms", roomRoutes);

app.use(errorMiddleware);

module.exports = app;
