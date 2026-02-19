import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@go-stop/shared";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (typeof window === "undefined") {
    throw new Error("Socket cannot be used on the server");
  }

  if (!socket) {
    // Dynamic require avoids top-level import of socket.io-client,
    // which would crash during SSR in Vercel's serverless functions.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { io } = require("socket.io-client") as typeof import("socket.io-client");
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(): GameSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
