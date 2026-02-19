import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@go-stop/shared";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";

let socket: GameSocket | null = null;
let ioFunc: typeof import("socket.io-client").io | null = null;

async function loadIo() {
  if (!ioFunc) {
    const mod = await import("socket.io-client");
    ioFunc = mod.io;
  }
  return ioFunc;
}

export async function getSocket(): Promise<GameSocket> {
  if (typeof window === "undefined") {
    throw new Error("Socket cannot be used on the server");
  }

  if (!socket) {
    const io = await loadIo();
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    }) as GameSocket;
  }
  return socket;
}

export async function connectSocket(): Promise<GameSocket> {
  const s = await getSocket();
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
