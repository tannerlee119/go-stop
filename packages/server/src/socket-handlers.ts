import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@go-stop/shared";
import type { RoomManager } from "./room-manager.js";
import type { GameRoomEvent } from "./game-room.js";
import { chooseBotAction } from "./bot.js";
import { nanoid } from "nanoid";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const BOT_ACTION_DELAY_MS = 800;

export function registerSocketHandlers(
  io: IOServer,
  socket: IOSocket,
  roomManager: RoomManager,
): void {
  const playerId = nanoid(10);
  socket.data.playerId = playerId;
  socket.data.roomId = null;

  // ─── Room Management ─────────────────────────────────────────────

  socket.on("room:list", (callback) => {
    callback(roomManager.listRooms());
  });

  socket.on("room:create", (data, callback) => {
    socket.data.playerName = data.playerName;

    const room = roomManager.createRoom(
      playerId,
      data.playerName,
      data.maxPlayers,
      data.config,
    );

    room.setSocketId(playerId, socket.id);
    socket.data.roomId = room.id;
    socket.join(room.id);

    setupRoomEvents(io, socket, room.id, roomManager);

    callback(room.toRoomInfo());
  });

  socket.on("room:join", (data, callback) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) {
      callback({ success: false, error: "Room not found" });
      return;
    }

    socket.data.playerName = data.playerName;
    const added = room.addPlayer(playerId, data.playerName, socket.id);

    if (!added) {
      callback({ success: false, error: "Could not join room (full or already playing)" });
      return;
    }

    room.setSocketId(playerId, socket.id);
    socket.data.roomId = room.id;
    socket.join(room.id);

    setupRoomEvents(io, socket, room.id, roomManager);

    io.to(room.id).emit("room:updated", room.toRoomInfo());
    socket.to(room.id).emit("room:player-joined", {
      playerId,
      playerName: data.playerName,
    });

    callback({ success: true, room: room.toRoomInfo() });
  });

  socket.on("room:leave", () => {
    leaveCurrentRoom(io, socket, roomManager);
  });

  socket.on("room:add-bot", (callback) => {
    const room = socket.data.roomId ? roomManager.getRoom(socket.data.roomId) : null;
    if (!room) {
      callback({ success: false, error: "Not in a room" });
      return;
    }

    if (room.isHost !== playerId) {
      callback({ success: false, error: "Only the host can add bots" });
      return;
    }

    const result = room.addBot();
    if (result.success) {
      io.to(room.id).emit("room:updated", room.toRoomInfo());
    }
    callback(result);
  });

  socket.on("room:start", (callback) => {
    const room = socket.data.roomId ? roomManager.getRoom(socket.data.roomId) : null;
    if (!room) {
      callback({ success: false, error: "Not in a room" });
      return;
    }

    if (room.isHost !== playerId) {
      callback({ success: false, error: "Only the host can start the game" });
      return;
    }

    const result = room.startGame();
    if (result.success) {
      io.to(room.id).emit("room:updated", room.toRoomInfo());
    }
    callback(result);
  });

  socket.on("room:restart", (callback) => {
    const room = socket.data.roomId ? roomManager.getRoom(socket.data.roomId) : null;
    if (!room) {
      callback({ success: false, error: "Not in a room" });
      return;
    }

    const result = room.restartGame();
    callback(result);
  });

  // ─── Game Actions ────────────────────────────────────────────────

  socket.on("game:action", (action, callback) => {
    const room = socket.data.roomId ? roomManager.getRoom(socket.data.roomId) : null;
    if (!room) {
      callback({ success: false, error: "Not in a room" });
      return;
    }

    const result = room.performAction(playerId, action);
    callback(result);
  });

  // ─── Disconnect ──────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);
    leaveCurrentRoom(io, socket, roomManager);
  });
}

function setupRoomEvents(
  io: IOServer,
  socket: IOSocket,
  roomId: string,
  roomManager: RoomManager,
): void {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const unsubscribe = room.onEvent((event: GameRoomEvent) => {
    handleRoomEvent(io, roomId, room, event, roomManager);
  });

  socket.on("disconnect", () => {
    unsubscribe();
  });
}

function handleRoomEvent(
  io: IOServer,
  roomId: string,
  room: ReturnType<RoomManager["getRoom"]>,
  event: GameRoomEvent,
  roomManager: RoomManager,
): void {
  if (!room) return;

  switch (event.type) {
    case "state-update": {
      const socketId = room.getSocketId(event.playerId);
      if (socketId) {
        io.to(socketId).emit("game:state", event.state);
      }
      break;
    }

    case "game-over":
      io.to(roomId).emit("game:over", {
        winnerId: event.winnerId,
        isNagari: event.isNagari,
        scores: event.scores,
        payments: event.payments,
      });
      break;

    case "deal-started":
      io.to(roomId).emit("game:deal-started", { dealNumber: event.dealNumber });
      break;

    case "special-event":
      io.to(roomId).emit("game:special-event", event.event);
      break;

    case "go-declared":
      io.to(roomId).emit("game:go-declared", {
        playerId: event.playerId,
        playerName: event.playerName,
        goCount: event.goCount,
      });
      break;

    case "bot-action-needed":
      scheduleBotAction(room, event.playerId);
      break;
  }
}

function scheduleBotAction(
  room: ReturnType<RoomManager["getRoom"]>,
  botPlayerId: string,
): void {
  if (!room) return;

  setTimeout(() => {
    const gameState = room.getGameState();
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== botPlayerId) return;

    const action = chooseBotAction(gameState);
    if (action) {
      room.performAction(botPlayerId, action);
    }
  }, BOT_ACTION_DELAY_MS);
}

function leaveCurrentRoom(
  io: IOServer,
  socket: IOSocket,
  roomManager: RoomManager,
): void {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const playerId = socket.data.playerId;
  const playerName = socket.data.playerName ?? "Unknown";

  room.removePlayer(playerId);
  socket.leave(roomId);
  socket.data.roomId = null;

  if (room.playerCount === 0) {
    roomManager.removeRoom(roomId);
  } else {
    io.to(roomId).emit("room:player-left", { playerId, playerName });
    io.to(roomId).emit("room:updated", room.toRoomInfo());
  }
}
