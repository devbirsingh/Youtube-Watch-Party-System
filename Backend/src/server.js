import http from "http";

import app from "./app.js";

import env from "./config/env.js";

import connectDatabase from "./config/database.js";

import {
  createSocketServer,
} from "./sockets/socketServer.js";


// =====================================================
// START APPLICATION
// =====================================================

const startServer = async () => {
  try {
    // Connect MongoDB first.
    await connectDatabase();


    // Create HTTP server using Express.
    const httpServer =
      http.createServer(app);


    // Attach Socket.IO to same server.
    createSocketServer(
      httpServer
    );


    // Start listening.
    httpServer.listen(
      env.port,
      () => {
        console.log(
          `Server running on port ${env.port}`
        );

        console.log(
          `http://localhost:${env.port}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error
    );

    process.exit(1);
  }
};


startServer();