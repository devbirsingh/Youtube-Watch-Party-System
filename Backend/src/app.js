import express from "express";
import cors from "cors";

import env from "./config/env.js";

import routes from "./routes.js";

import {
  notFoundMiddleware,
} from "./middlewares/notFoundMiddleware.js";

import {
  errorMiddleware,
} from "./middlewares/errorMiddleware.js";


const app = express();


// =====================================================
// GLOBAL MIDDLEWARE
// =====================================================

// Allow frontend to communicate with backend.
app.use(
  cors({
    origin: env.clientUrl,
  })
);


// Parse JSON request bodies.
app.use(
  express.json()
);


// Parse URL encoded data.
app.use(
  express.urlencoded({
    extended: true,
  })
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "YouTube Watch Party API is running",
    });
  }
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api",
  routes
);


// =====================================================
// ERROR HANDLING
// =====================================================

app.use(
  notFoundMiddleware
);

app.use(
  errorMiddleware
);


export default app;