// ─── Card Types ────────────────────────────────────────────────────────────

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CardType = "bright" | "animal" | "ribbon" | "junk";

export type RibbonKind = "red-poem" | "red-plain" | "blue" | "other";

export interface CardDefinition {
  id: string;
  month: Month;
  type: CardType;
  name: string;
  flower: string;
  ribbonKind?: RibbonKind;
  isDoubleJunk?: boolean;
  isBird?: boolean;
  isSakeCup?: boolean;
}

export interface Card extends CardDefinition {
  faceUp: boolean;
}

// ─── Table Layout ──────────────────────────────────────────────────────────

export interface TableStack {
  cards: Card[];
  month: Month;
}

// ─── Player ────────────────────────────────────────────────────────────────

export interface CapturedCards {
  brights: Card[];
  animals: Card[];
  ribbons: Card[];
  junk: Card[];
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  captured: CapturedCards;
  score: number;
  goCount: number;
  heundeumSets: Month[];
  isBot: boolean;
  isConnected: boolean;
  bombSkipsRemaining: number;
}

// ─── Scoring ───────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  total: number;
  brightScore: number;
  brightSetSize: number;
  animalScore: number;
  animalCount: number;
  godori: boolean;
  ribbonScore: number;
  ribbonCount: number;
  hongDan: boolean;
  cheongDan: boolean;
  choDan: boolean;
  junkScore: number;
  junkCount: number;
}

// ─── Game Phases ───────────────────────────────────────────────────────────

export type GamePhase =
  | "waiting"
  | "dealing"
  | "checking-initial"
  | "play-from-hand"
  | "choose-hand-capture"
  | "draw-from-stock"
  | "choose-stock-capture"
  | "resolve-captures"
  | "go-stop-decision"
  | "finished";

// ─── Special Events ────────────────────────────────────────────────────────

export type SpecialEventType =
  | "ppuk"
  | "ja-ppuk"
  | "chok"
  | "ttadak"
  | "sseul"
  | "triple-ppuk"
  | "first-turn-ppuk"
  | "heundeum"
  | "bomb";

export interface SpecialEvent {
  type: SpecialEventType;
  playerId: string;
  junkPenalty: number;
}

// ─── Turn Actions ──────────────────────────────────────────────────────────

export interface PlayCardAction {
  type: "play-card";
  cardId: string;
  targetCardId?: string;
}

export interface ChooseCaptureAction {
  type: "choose-capture";
  targetCardId: string;
}

export interface GoAction {
  type: "go";
}

export interface StopAction {
  type: "stop";
}

export interface BombAction {
  type: "bomb";
  month: Month;
}

export interface SkipHandAction {
  type: "skip-hand";
}

export interface HeundeumAction {
  type: "heundeum";
  month: Month;
}

export type GameAction =
  | PlayCardAction
  | ChooseCaptureAction
  | GoAction
  | StopAction
  | BombAction
  | SkipHandAction
  | HeundeumAction;

// ─── Game State ────────────────────────────────────────────────────────────

export interface GameConfig {
  playerCount: number;
  targetScore: number;
  totalDeals: number;
  useJokers: boolean;
}

export interface TurnState {
  handCard: Card | null;
  handMatchedStack: TableStack | null;
  stockCard: Card | null;
  stockMatchedStack: TableStack | null;
  capturedThisTurn: Card[];
  specialEvents: SpecialEvent[];
  isPpuk: boolean;
  isFirstTurn: boolean;
}

export interface GameState {
  config: GameConfig;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  tableStacks: TableStack[];
  dealNumber: number;
  nagariMultiplier: number;
  turnState: TurnState;
  ppukStacks: Map<string, Month>;
  winner: string | null;
  lastGoScores: Map<string, number>;
  turnCount: number;
}

// ─── Game Result ───────────────────────────────────────────────────────────

export type PaymentMultiplier = {
  reason: string;
  multiplier: number;
};

export interface GameResult {
  winnerId: string | null;
  isNagari: boolean;
  scores: Map<string, ScoreBreakdown>;
  payments: Map<string, number>;
  multipliers: PaymentMultiplier[];
}

// ─── Room Types ────────────────────────────────────────────────────────────

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  players: { id: string; name: string; isBot: boolean }[];
  maxPlayers: number;
  status: RoomStatus;
  config: GameConfig;
}

// ─── Client View ───────────────────────────────────────────────────────────

export interface PlayerView {
  id: string;
  name: string;
  handSize: number;
  captured: CapturedCards;
  score: number;
  goCount: number;
  heundeumSets: Month[];
  isBot: boolean;
  isConnected: boolean;
  bombSkipsRemaining: number;
}

export interface ClientGameState {
  phase: GamePhase;
  myHand: Card[];
  myId: string;
  players: PlayerView[];
  currentPlayerIndex: number;
  tableStacks: TableStack[];
  deckSize: number;
  dealNumber: number;
  nagariMultiplier: number;
  turnState: {
    handCard: Card | null;
    stockCard: Card | null;
    capturedThisTurn: Card[];
    specialEvents: SpecialEvent[];
  };
  validActions: GameAction["type"][];
  captureChoices: Card[];
  winner: string | null;
  config: GameConfig;
}
