import { create } from "zustand";
import type {
  ClientGameState,
  GameAction,
  RoomInfo,
  ScoreBreakdown,
  SpecialEvent,
} from "@go-stop/shared";
import { connectSocket, disconnectSocket, type GameSocket } from "@/lib/socket";

interface GameOverData {
  winnerId: string | null;
  isNagari: boolean;
  scores: Record<string, ScoreBreakdown>;
  payments: Record<string, number>;
}

interface GameStore {
  socket: GameSocket | null;
  connected: boolean;
  playerName: string;

  room: RoomInfo | null;
  roomError: string | null;

  gameState: ClientGameState | null;
  gameOver: GameOverData | null;
  specialEvents: SpecialEvent[];
  lastGoDeclaration: { playerName: string; goCount: number } | null;

  connect: (playerName: string) => void;
  disconnect: () => void;
  createRoom: (maxPlayers: number) => Promise<RoomInfo | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
  addBot: () => Promise<boolean>;
  startGame: () => Promise<boolean>;
  sendAction: (action: GameAction) => Promise<boolean>;
  listRooms: () => Promise<RoomInfo[]>;
  clearGameOver: () => void;
  clearSpecialEvents: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  playerName: "",
  room: null,
  roomError: null,
  gameState: null,
  gameOver: null,
  specialEvents: [],
  lastGoDeclaration: null,

  connect: (playerName: string) => {
    if (typeof window === "undefined") return;

    connectSocket().then((socket) => {
      set({ socket, playerName });

      socket.on("connect", () => {
        set({ connected: true });
      });

      socket.on("disconnect", () => {
        set({ connected: false });
      });

      socket.on("room:updated", (room) => {
        set({ room });
      });

      socket.on("room:closed", () => {
        set({ room: null, gameState: null });
      });

      socket.on("game:state", (state) => {
        set({ gameState: state });
      });

      socket.on("game:over", (data) => {
        set({ gameOver: data });
      });

      socket.on("game:special-event", (event) => {
        set((s) => ({ specialEvents: [...s.specialEvents, event] }));
      });

      socket.on("game:go-declared", (data) => {
        set({
          lastGoDeclaration: {
            playerName: data.playerName,
            goCount: data.goCount,
          },
        });
        setTimeout(() => set({ lastGoDeclaration: null }), 2000);
      });

      socket.on("error", (message) => {
        console.error("[server error]", message);
      });
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({
      socket: null,
      connected: false,
      room: null,
      gameState: null,
      gameOver: null,
    });
  },

  createRoom: async (maxPlayers: number) => {
    const { socket, playerName } = get();
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit(
        "room:create",
        { playerName, maxPlayers },
        (room) => {
          set({ room, roomError: null });
          resolve(room);
        },
      );
    });
  },

  joinRoom: async (roomId: string) => {
    const { socket, playerName } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit("room:join", { roomId, playerName }, (result) => {
        if (result.success && result.room) {
          set({ room: result.room, roomError: null });
          resolve(true);
        } else {
          set({ roomError: result.error ?? "Failed to join" });
          resolve(false);
        }
      });
    });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit("room:leave");
    }
    set({ room: null, gameState: null, gameOver: null });
  },

  addBot: async () => {
    const { socket } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit("room:add-bot", (result) => {
        resolve(result.success);
      });
    });
  },

  startGame: async () => {
    const { socket } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit("room:start", (result) => {
        if (!result.success) {
          set({ roomError: result.error ?? "Failed to start" });
        }
        resolve(result.success);
      });
    });
  },

  sendAction: async (action: GameAction) => {
    const { socket } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit("game:action", action, (result) => {
        if (!result.success) {
          console.error("[action error]", result.error);
        }
        resolve(result.success);
      });
    });
  },

  listRooms: async () => {
    const { socket } = get();
    if (!socket) return [];

    return new Promise((resolve) => {
      socket.emit("room:list", (rooms) => {
        resolve(rooms);
      });
    });
  },

  clearGameOver: () => set({ gameOver: null }),
  clearSpecialEvents: () => set({ specialEvents: [] }),
}));
