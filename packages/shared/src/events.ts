import type {
  ClientGameState,
  GameAction,
  GameConfig,
  RoomInfo,
  ScoreBreakdown,
  SpecialEvent,
} from "./types.js";

// ─── Client → Server Events ───────────────────────────────────────────────

export interface ClientToServerEvents {
  "room:create": (data: { playerName: string; maxPlayers: number; config?: Partial<GameConfig> }, callback: (room: RoomInfo) => void) => void;
  "room:join": (data: { roomId: string; playerName: string }, callback: (result: { success: boolean; error?: string; room?: RoomInfo }) => void) => void;
  "room:leave": () => void;
  "room:add-bot": (callback: (result: { success: boolean; error?: string }) => void) => void;
  "room:start": (callback: (result: { success: boolean; error?: string }) => void) => void;
  "room:list": (callback: (rooms: RoomInfo[]) => void) => void;
  "game:action": (action: GameAction, callback: (result: { success: boolean; error?: string }) => void) => void;
}

// ─── Server → Client Events ───────────────────────────────────────────────

export interface ServerToClientEvents {
  "room:updated": (room: RoomInfo) => void;
  "room:closed": (reason: string) => void;
  "room:player-joined": (data: { playerId: string; playerName: string }) => void;
  "room:player-left": (data: { playerId: string; playerName: string }) => void;
  "game:state": (state: ClientGameState) => void;
  "game:action-required": (data: { validActions: GameAction["type"][]; timeoutMs: number }) => void;
  "game:special-event": (event: SpecialEvent) => void;
  "game:go-declared": (data: { playerId: string; playerName: string; goCount: number }) => void;
  "game:over": (result: { winnerId: string | null; isNagari: boolean; scores: Record<string, ScoreBreakdown>; payments: Record<string, number> }) => void;
  "game:deal-started": (data: { dealNumber: number }) => void;
  "error": (message: string) => void;
}

// ─── Inter-Server Events ──────────────────────────────────────────────────

export interface InterServerEvents {
  ping: () => void;
}

// ─── Socket Data ──────────────────────────────────────────────────────────

export interface SocketData {
  playerId: string;
  playerName: string;
  roomId: string | null;
}
