import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@go-stop/shared";
import { registerSocketHandlers } from "./socket-handlers.js";
import { RoomManager } from "./room-manager.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_URL }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: roomManager.getRoomCount() });
});

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager();

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);
  registerSocketHandlers(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`Go-Stop server running on port ${PORT}`);
  console.log(`Accepting connections from ${CLIENT_URL}`);
});
