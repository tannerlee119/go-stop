import {
  checkInitialConditions,
  createGameState,
  getValidActions,
  maybeAdvancePastEmptyHand,
  processAction,
  resolveDrawnStock,
  startDeal,
  toClientGameState,
  calculateScore,
  calculatePayment,
  calculatePaymentMultipliers,
} from "@go-stop/shared";
import type {
  ClientGameState,
  GameAction,
  GameConfig,
  GameState,
  RoomInfo,
  RoomStatus,
  ScoreBreakdown,
} from "@go-stop/shared";
import { nanoid } from "nanoid";

interface RoomPlayer {
  id: string;
  name: string;
  socketId: string | null;
  isBot: boolean;
}

export type GameRoomEvent =
  | { type: "state-update"; state: ClientGameState; playerId: string }
  | { type: "game-over"; winnerId: string | null; isNagari: boolean; scores: Record<string, ScoreBreakdown>; payments: Record<string, number> }
  | { type: "deal-started"; dealNumber: number }
  | { type: "special-event"; event: GameState["turnState"]["specialEvents"][number] }
  | { type: "go-declared"; playerId: string; playerName: string; goCount: number }
  | { type: "bot-action-needed"; playerId: string };

export class GameRoom {
  readonly id: string;
  private hostId: string;
  private players: RoomPlayer[] = [];
  private maxPlayers: number;
  private configOverrides: Partial<GameConfig>;
  private gameState: GameState | null = null;
  private eventListeners: ((event: GameRoomEvent) => void)[] = [];

  status: RoomStatus = "waiting";

  constructor(
    id: string,
    hostId: string,
    hostName: string,
    maxPlayers: number,
    config?: Partial<GameConfig>,
  ) {
    this.id = id;
    this.hostId = hostId;
    this.maxPlayers = Math.min(Math.max(maxPlayers, 1), 4);
    this.configOverrides = config ?? {};
    this.addPlayer(hostId, hostName, null);
  }

  get playerCount(): number {
    return this.players.length;
  }

  get isHost(): string {
    return this.hostId;
  }

  onEvent(listener: (event: GameRoomEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GameRoomEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  addPlayer(id: string, name: string, socketId: string | null): boolean {
    if (this.players.length >= this.maxPlayers) return false;
    if (this.players.some((p) => p.id === id)) return false;
    if (this.status !== "waiting") return false;

    this.players.push({ id, name, socketId, isBot: false });
    return true;
  }

  addBot(): { success: boolean; botId?: string; error?: string } {
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: "Room is full" };
    }

    const botId = `bot-${nanoid(6)}`;
    const botNumber = this.players.filter((p) => p.isBot).length + 1;
    this.players.push({
      id: botId,
      name: `Bot ${botNumber}`,
      socketId: null,
      isBot: true,
    });

    return { success: true, botId };
  }

  removePlayer(id: string): boolean {
    const index = this.players.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.players.splice(index, 1);

    if (this.gameState) {
      const gsPlayer = this.gameState.players.find((p) => p.id === id);
      if (gsPlayer) {
        gsPlayer.isConnected = false;
      }
    }

    if (id === this.hostId && this.players.length > 0) {
      const newHost = this.players.find((p) => !p.isBot);
      if (newHost) this.hostId = newHost.id;
    }

    return true;
  }

  setSocketId(playerId: string, socketId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socketId;
    }
    if (this.gameState) {
      const gsPlayer = this.gameState.players.find((p) => p.id === playerId);
      if (gsPlayer) {
        gsPlayer.isConnected = true;
      }
    }
  }

  getSocketId(playerId: string): string | null {
    return this.players.find((p) => p.id === playerId)?.socketId ?? null;
  }

  getPlayerIds(): string[] {
    return this.players.map((p) => p.id);
  }

  isPlayerInRoom(id: string): boolean {
    return this.players.some((p) => p.id === id);
  }

  startGame(): { success: boolean; error?: string } {
    if (this.players.length < 2) {
      return { success: false, error: "Need at least 2 players to start" };
    }

    this.status = "playing";
    this.gameState = createGameState(
      this.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot })),
      this.configOverrides,
    );

    this.beginDeal();
    return { success: true };
  }

  private beginDeal(): void {
    if (!this.gameState) return;

    this.gameState = startDeal(this.gameState);
    const { state, quadWinners, tableQuad } = checkInitialConditions(this.gameState);
    this.gameState = state;

    this.emit({ type: "deal-started", dealNumber: this.gameState.dealNumber });

    if (tableQuad) {
      // Redeal
      this.beginDeal();
      return;
    }

    if (quadWinners.length > 0) {
      // Quad instant win
      this.gameState = { ...this.gameState, phase: "finished", winner: quadWinners[0] };
    }

    this.broadcastState();
    this.checkForBotTurn();
  }

  performAction(playerId: string, action: GameAction): { success: boolean; error?: string } {
    if (!this.gameState) {
      return { success: false, error: "Game not started" };
    }

    const validActions = getValidActions(this.gameState);
    if (!validActions.includes(action.type)) {
      return { success: false, error: `Invalid action: ${action.type}` };
    }

    try {
      this.gameState = processAction(this.gameState, playerId, action);

      if (action.type === "go") {
        const player = this.gameState.players.find((p) => p.id === playerId)!;
        this.emit({
          type: "go-declared",
          playerId,
          playerName: player.name,
          goCount: player.goCount,
        });
      }

      this.postStateUpdate();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: message };
    }
  }

  private stockResolveTimer: ReturnType<typeof setTimeout> | null = null;
  private emittedEventCount = 0;

  private postStateUpdate(): void {
    if (!this.gameState) return;

    this.gameState = maybeAdvancePastEmptyHand(this.gameState);

    const events = this.gameState.turnState.specialEvents;
    if (events.length < this.emittedEventCount) this.emittedEventCount = 0;
    for (let i = this.emittedEventCount; i < events.length; i++) {
      this.emit({ type: "special-event", event: events[i] });
    }
    this.emittedEventCount = events.length;

    if (this.gameState.phase === "finished") {
      this.handleGameOver();
    }

    this.broadcastState();

    if (this.gameState.phase === "draw-from-stock") {
      this.scheduleStockResolve();
    } else {
      this.checkForBotTurn();
    }
  }

  private scheduleStockResolve(): void {
    if (this.stockResolveTimer) clearTimeout(this.stockResolveTimer);
    this.stockResolveTimer = setTimeout(() => {
      this.stockResolveTimer = null;
      if (!this.gameState || this.gameState.phase !== "draw-from-stock") return;

      this.gameState = resolveDrawnStock(this.gameState);
      this.postStateUpdate();
    }, 1500);
  }

  private handleGameOver(): void {
    if (!this.gameState) return;

    const isNagari = this.gameState.winner === null;
    const scores: Record<string, ScoreBreakdown> = {};
    const payments: Record<string, number> = {};

    for (const player of this.gameState.players) {
      scores[player.id] = calculateScore(player.captured);
      payments[player.id] = 0;
    }

    if (!isNagari && this.gameState.winner) {
      const winner = this.gameState.players.find((p) => p.id === this.gameState!.winner)!;
      const winnerScore = scores[winner.id];

      for (const loser of this.gameState.players) {
        if (loser.id === winner.id) continue;
        const loserScore = scores[loser.id];
        const multipliers = calculatePaymentMultipliers(
          winner,
          loser,
          winnerScore,
          loserScore,
          this.gameState.nagariMultiplier,
        );
        const payment = calculatePayment(
          winnerScore.total,
          winner.goCount,
          multipliers,
        );
        payments[loser.id] = -payment;
        payments[winner.id] = (payments[winner.id] ?? 0) + payment;
      }
    }

    this.emit({
      type: "game-over",
      winnerId: this.gameState.winner,
      isNagari,
      scores,
      payments,
    });
  }

  private broadcastState(): void {
    if (!this.gameState) return;

    this.gameState = maybeAdvancePastEmptyHand(this.gameState);

    for (const player of this.players) {
      const clientState = toClientGameState(this.gameState, player.id);
      this.emit({ type: "state-update", state: clientState, playerId: player.id });
    }
  }

  private checkForBotTurn(): void {
    if (!this.gameState || this.gameState.phase === "finished") return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (currentPlayer.isBot) {
      this.emit({ type: "bot-action-needed", playerId: currentPlayer.id });
    }
  }

  getClientState(playerId: string): ClientGameState | null {
    if (!this.gameState) return null;
    return toClientGameState(this.gameState, playerId);
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  toRoomInfo(): RoomInfo {
    return {
      id: this.id,
      name: `${this.players[0]?.name ?? "Empty"}'s Room`,
      hostId: this.hostId,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
      })),
      maxPlayers: this.maxPlayers,
      status: this.status,
      config: {
        playerCount: this.players.length,
        targetScore: this.configOverrides.targetScore ?? 7,
        totalDeals: this.configOverrides.totalDeals ?? 12,
        useJokers: this.configOverrides.useJokers ?? false,
      },
    };
  }
}
