import { deal, drawFromStock, groupIntoStacks } from "./deck.js";
import {
  addToCaptured,
  findBombs,
  findMatches,
  findQuads,
  findTriples,
  playCardToTable,
  resolveStockCard,
  surrenderJunk,
} from "./matching.js";
import { calculateScore } from "./scoring.js";
import type {
  Card,
  CapturedCards,
  ClientGameState,
  GameAction,
  GameConfig,
  GameState,
  Month,
  Player,
  PlayerView,
  SpecialEvent,
  TurnState,
} from "./types.js";
import {
  DEFAULT_TARGET_SCORE_2P,
  DEFAULT_TARGET_SCORE_3P,
  DEFAULT_TOTAL_DEALS,
} from "./constants.js";

function emptyCaptured(): CapturedCards {
  return { brights: [], animals: [], ribbons: [], junk: [] };
}

function emptyTurnState(): TurnState {
  return {
    handCard: null,
    handMatchedStack: null,
    stockCard: null,
    stockMatchedStack: null,
    capturedThisTurn: [],
    specialEvents: [],
    isPpuk: false,
    isFirstTurn: false,
  };
}

function createPlayer(id: string, name: string, isBot: boolean): Player {
  return {
    id,
    name,
    hand: [],
    captured: emptyCaptured(),
    score: 0,
    goCount: 0,
    heundeumSets: [],
    isBot,
    isConnected: !isBot,
    bombSkipsRemaining: 0,
  };
}

export function createDefaultConfig(playerCount: number): GameConfig {
  return {
    playerCount,
    targetScore: playerCount <= 2 ? DEFAULT_TARGET_SCORE_2P : DEFAULT_TARGET_SCORE_3P,
    totalDeals: DEFAULT_TOTAL_DEALS,
    useJokers: false,
  };
}

export function createGameState(
  players: { id: string; name: string; isBot: boolean }[],
  config?: Partial<GameConfig>,
): GameState {
  const playerCount = players.length;
  const fullConfig: GameConfig = {
    ...createDefaultConfig(playerCount),
    ...config,
    playerCount,
  };

  return {
    config: fullConfig,
    phase: "waiting",
    players: players.map((p) => createPlayer(p.id, p.name, p.isBot)),
    currentPlayerIndex: 0,
    deck: [],
    tableStacks: [],
    dealNumber: 0,
    nagariMultiplier: 1,
    turnState: emptyTurnState(),
    ppukStacks: new Map(),
    winner: null,
    lastGoScores: new Map(),
    turnCount: 0,
  };
}

// ─── Deal Phase ────────────────────────────────────────────────────────────

export function startDeal(state: GameState): GameState {
  const { hands, tableCards, stock } = deal(state.config.playerCount);

  const players = state.players.map((p, i) => ({
    ...p,
    hand: hands[i] ?? [],
    captured: emptyCaptured(),
    score: 0,
    goCount: 0,
    heundeumSets: [],
    bombSkipsRemaining: 0,
  }));

  const tableStacks = groupIntoStacks(tableCards);

  return {
    ...state,
    phase: "checking-initial",
    players,
    deck: stock,
    tableStacks,
    dealNumber: state.dealNumber + 1,
    turnState: emptyTurnState(),
    ppukStacks: new Map(),
    winner: null,
    lastGoScores: new Map(),
    turnCount: 0,
  };
}

// ─── Initial Check Phase ───────────────────────────────────────────────────

export interface InitialCheckResult {
  state: GameState;
  quadWinners: string[];
  tableQuad: boolean;
  tableTriples: Month[];
}

export function checkInitialConditions(state: GameState): InitialCheckResult {
  let newState = { ...state };
  const quadWinners: string[] = [];

  // Check for quads in hand
  for (const player of newState.players) {
    const quads = findQuads(player.hand);
    if (quads.length > 0) {
      quadWinners.push(player.id);
    }
  }

  // Check for quad on table (4 cards of same month → redeal)
  const tableQuad = newState.tableStacks.some((s) => s.cards.length >= 4);

  // Check for triples on table (combine into stacks)
  const tableTriples: Month[] = [];
  newState = {
    ...newState,
    tableStacks: newState.tableStacks.map((stack) => {
      if (stack.cards.length === 3) {
        tableTriples.push(stack.month);
      }
      return stack;
    }),
  };

  if (!tableQuad && quadWinners.length === 0) {
    newState = { ...newState, phase: "play-from-hand" };
  }

  return { state: newState, quadWinners, tableQuad, tableTriples };
}

// ─── Turn Management ───────────────────────────────────────────────────────

function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/**
 * Get the valid actions for the current game state.
 */
export function getValidActions(state: GameState): GameAction["type"][] {
  const player = currentPlayer(state);
  const actions: GameAction["type"][] = [];

  switch (state.phase) {
    case "play-from-hand": {
      if (player.bombSkipsRemaining > 0) {
        actions.push("skip-hand");
      }
      if (player.hand.length > 0) {
        actions.push("play-card");

        // Check for bombs
        const bombs = findBombs(player.hand, state.tableStacks);
        if (bombs.length > 0) {
          actions.push("bomb");
        }

        // Check for heundeum (only if not already declared for that month)
        const triples = findTriples(player.hand);
        const undeclared = triples.filter((m) => !player.heundeumSets.includes(m));
        if (undeclared.length > 0) {
          actions.push("heundeum");
        }
      }
      break;
    }

    case "choose-hand-capture":
      actions.push("choose-capture");
      break;

    case "choose-stock-capture":
      actions.push("choose-capture");
      break;

    case "go-stop-decision":
      actions.push("go", "stop");
      break;

    default:
      break;
  }

  return actions;
}

/**
 * Get capture choice options for the current state.
 */
export function getCaptureChoices(state: GameState): Card[] {
  if (state.phase === "choose-hand-capture" && state.turnState.handCard) {
    const match = findMatches(state.turnState.handCard, state.tableStacks);
    if (match.type === "double-match") {
      return match.matchingStacks.flatMap((s) => s.cards);
    }
  }

  if (state.phase === "choose-stock-capture" && state.turnState.stockCard) {
    const match = findMatches(state.turnState.stockCard, state.tableStacks);
    if (match.type === "double-match") {
      return match.matchingStacks.flatMap((s) => s.cards);
    }
  }

  return [];
}

// ─── Action Processing ─────────────────────────────────────────────────────

export function processAction(state: GameState, playerId: string, action: GameAction): GameState {
  const player = currentPlayer(state);
  if (player.id !== playerId && state.phase !== "go-stop-decision") {
    throw new Error("Not your turn");
  }

  switch (action.type) {
    case "play-card":
      return processPlayCard(state, action.cardId);
    case "choose-capture":
      return processChooseCapture(state, action.targetCardId);
    case "go":
      return processGo(state, playerId);
    case "stop":
      return processStop(state, playerId);
    case "bomb":
      return processBomb(state, action.month);
    case "skip-hand":
      return processSkipHand(state);
    case "heundeum":
      return processHeundeum(state, action.month);
  }
}

function processPlayCard(state: GameState, cardId: string): GameState {
  const player = currentPlayer(state);
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error("Card not in hand");

  const card = player.hand[cardIndex];
  const newHand = player.hand.filter((_, i) => i !== cardIndex);
  const isFirstTurn = state.turnCount < state.config.playerCount;

  const result = playCardToTable(card, state.tableStacks);

  if (result.needsChoice) {
    return {
      ...state,
      phase: "choose-hand-capture",
      players: state.players.map((p) =>
        p.id === player.id ? { ...p, hand: newHand } : p,
      ),
      turnState: {
        ...emptyTurnState(),
        handCard: card,
        isFirstTurn,
      },
    };
  }

  // Card was placed on table (paired or added), now draw from stock
  return proceedToStockDraw({
    ...state,
    players: state.players.map((p) =>
      p.id === player.id ? { ...p, hand: newHand } : p,
    ),
    tableStacks: result.updatedStacks,
    turnState: {
      ...emptyTurnState(),
      handCard: card,
      capturedThisTurn: result.captured,
      isFirstTurn,
    },
  });
}

function processChooseCapture(state: GameState, targetCardId: string): GameState {
  const player = currentPlayer(state);

  if (state.phase === "choose-hand-capture") {
    const card = state.turnState.handCard!;
    const result = playCardToTable(card, state.tableStacks, targetCardId);

    return proceedToStockDraw({
      ...state,
      tableStacks: result.updatedStacks,
      turnState: {
        ...state.turnState,
        capturedThisTurn: [...state.turnState.capturedThisTurn, ...result.captured],
      },
    });
  }

  if (state.phase === "choose-stock-capture") {
    const stockCard = state.turnState.stockCard!;
    const handCard = state.turnState.handCard!;
    const result = resolveStockCard(stockCard, handCard, state.tableStacks, targetCardId);

    return finalizeTurn({
      ...state,
      tableStacks: result.updatedStacks,
      turnState: {
        ...state.turnState,
        capturedThisTurn: [...state.turnState.capturedThisTurn, ...result.captured],
        specialEvents: buildSpecialEvents(state, result, player.id),
      },
    });
  }

  throw new Error("Invalid state for choose-capture");
}

function proceedToStockDraw(state: GameState): GameState {
  const drawResult = drawFromStock(state.deck);
  if (!drawResult) {
    return finalizeTurn(state);
  }

  const { drawn, remaining } = drawResult;
  const handCard = state.turnState.handCard!;
  const result = resolveStockCard(drawn, handCard, state.tableStacks);

  if (result.needsChoice) {
    return {
      ...state,
      phase: "choose-stock-capture",
      deck: remaining,
      turnState: {
        ...state.turnState,
        stockCard: drawn,
      },
    };
  }

  const player = currentPlayer(state);
  return finalizeTurn({
    ...state,
    deck: remaining,
    tableStacks: result.updatedStacks,
    turnState: {
      ...state.turnState,
      stockCard: drawn,
      capturedThisTurn: [...state.turnState.capturedThisTurn, ...result.captured],
      specialEvents: buildSpecialEvents(state, result, player.id),
      isPpuk: result.isPpuk,
    },
  });
}

function buildSpecialEvents(
  state: GameState,
  result: { isPpuk: boolean; isChok: boolean; isTtadak: boolean; isSseul: boolean },
  playerId: string,
): SpecialEvent[] {
  const events: SpecialEvent[] = [...state.turnState.specialEvents];

  if (result.isPpuk && result.isPpuk) {
    const wasOwnPpuk = state.ppukStacks.get(playerId) !== undefined;
    if (wasOwnPpuk) {
      events.push({ type: "ja-ppuk", playerId, junkPenalty: 2 });
    } else {
      events.push({ type: "ppuk", playerId, junkPenalty: 1 });
    }
  }

  if (result.isChok && !isLastTurnOfGame(state)) {
    events.push({ type: "chok", playerId, junkPenalty: 1 });
  }

  if (result.isTtadak && !isLastTurnOfGame(state)) {
    events.push({ type: "ttadak", playerId, junkPenalty: 1 });
  }

  if (result.isSseul) {
    events.push({ type: "sseul", playerId, junkPenalty: 1 });
  }

  return events;
}

function isLastTurnOfGame(state: GameState): boolean {
  const player = currentPlayer(state);
  return player.hand.length === 0 && state.deck.length <= 1;
}

function finalizeTurn(state: GameState): GameState {
  const player = currentPlayer(state);
  const captured = state.turnState.capturedThisTurn;

  // Add captured cards to player's area
  let updatedPlayers = state.players.map((p) =>
    p.id === player.id
      ? { ...p, captured: addToCaptured(p.captured, captured) }
      : p,
  );

  // Process special event penalties (junk surrender)
  let updatedState = { ...state, players: updatedPlayers };
  for (const event of state.turnState.specialEvents) {
    updatedState = applyJunkPenalty(updatedState, event);
  }

  // Track ppuk stacks
  const newPpukStacks = new Map(state.ppukStacks);
  if (state.turnState.isPpuk) {
    // Find the ppuk stack on the table
    for (const stack of state.tableStacks) {
      if (stack.cards.length === 3) {
        newPpukStacks.set(player.id, stack.month);
      }
    }
  }

  // Calculate player's score
  const updatedPlayer = updatedState.players.find((p) => p.id === player.id)!;
  const scoreBreakdown = calculateScore(updatedPlayer.captured);
  updatedPlayers = updatedState.players.map((p) =>
    p.id === player.id ? { ...p, score: scoreBreakdown.total } : p,
  );

  const stateWithScores = {
    ...updatedState,
    players: updatedPlayers,
    ppukStacks: newPpukStacks,
    turnCount: state.turnCount + 1,
  };

  // Check if player can stop (score meets/exceeds target)
  const currentScore = scoreBreakdown.total;
  const targetScore = state.config.targetScore;
  const lastGoScore = state.lastGoScores.get(player.id) ?? 0;

  if (currentScore >= targetScore && currentScore > lastGoScore) {
    return { ...stateWithScores, phase: "go-stop-decision" };
  }

  // Check if the game has run out of cards
  if (allHandsEmpty(stateWithScores)) {
    return endDealAsNagari(stateWithScores);
  }

  return advanceToNextPlayer(stateWithScores);
}

function applyJunkPenalty(state: GameState, event: SpecialEvent): GameState {
  const surrenderedCards: Card[] = [];

  const playersAfterSurrender = state.players.map((p) => {
    if (p.id === event.playerId) return p;

    let remaining = p.captured;
    for (let i = 0; i < event.junkPenalty; i++) {
      const result = surrenderJunk(remaining);
      if (result.card) {
        surrenderedCards.push(result.card);
        remaining = result.remaining;
      }
    }

    return { ...p, captured: remaining };
  });

  // Add surrendered cards to the event player's junk
  return {
    ...state,
    players: playersAfterSurrender.map((p) => {
      if (p.id !== event.playerId) return p;
      return {
        ...p,
        captured: addToCaptured(p.captured, surrenderedCards),
      };
    }),
  };
}

function processGo(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const newGoCount = player.goCount + 1;
  const newLastGoScores = new Map(state.lastGoScores);
  newLastGoScores.set(playerId, player.score);

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, goCount: newGoCount } : p,
  );

  return advanceToNextPlayer({
    ...state,
    players: updatedPlayers,
    lastGoScores: newLastGoScores,
  });
}

function processStop(state: GameState, playerId: string): GameState {
  return {
    ...state,
    phase: "finished",
    winner: playerId,
  };
}

function processBomb(state: GameState, month: Month): GameState {
  const player = currentPlayer(state);

  // Remove 3 cards of the month from hand
  const bombCards = player.hand.filter((c) => c.month === month);
  if (bombCards.length < 3) throw new Error("Not enough cards for bomb");

  const cardsToPlay = bombCards.slice(0, 3);
  const newHand = player.hand.filter(
    (c) => !cardsToPlay.some((bc) => bc.id === c.id),
  );

  // Capture the 4th card from the table
  const targetStack = state.tableStacks.find((s) => s.month === month);
  if (!targetStack) throw new Error("No matching card on table for bomb");

  const captured = [...cardsToPlay, ...targetStack.cards];
  const updatedStacks = state.tableStacks.filter((s) => s !== targetStack);

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id
      ? {
          ...p,
          hand: newHand,
          captured: addToCaptured(p.captured, captured),
          bombSkipsRemaining: p.bombSkipsRemaining + 2,
        }
      : p,
  );

  // Now draw from stock
  return proceedToStockDraw({
    ...state,
    players: updatedPlayers,
    tableStacks: updatedStacks,
    turnState: {
      ...emptyTurnState(),
      handCard: cardsToPlay[0],
      capturedThisTurn: captured,
      specialEvents: [{ type: "bomb", playerId: player.id, junkPenalty: 1 }],
    },
  });
}

function processSkipHand(state: GameState): GameState {
  const player = currentPlayer(state);
  if (player.bombSkipsRemaining <= 0) throw new Error("No skips remaining");

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id
      ? { ...p, bombSkipsRemaining: p.bombSkipsRemaining - 1 }
      : p,
  );

  return proceedToStockDraw({
    ...state,
    players: updatedPlayers,
    turnState: {
      ...emptyTurnState(),
      handCard: null,
      isFirstTurn: false,
    },
  });
}

function processHeundeum(state: GameState, month: Month): GameState {
  const player = currentPlayer(state);
  const tripleCards = player.hand.filter((c) => c.month === month);
  if (tripleCards.length < 3) throw new Error("Not enough cards for heundeum");

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id
      ? { ...p, heundeumSets: [...p.heundeumSets, month] }
      : p,
  );

  // Heundeum is just a declaration, play continues normally
  return { ...state, players: updatedPlayers };
}

// ─── Turn Advancement ──────────────────────────────────────────────────────

function advanceToNextPlayer(state: GameState): GameState {
  const playerCount = state.config.playerCount;
  let nextIndex = (state.currentPlayerIndex + 1) % playerCount;

  // Skip disconnected players (but not bots)
  let attempts = 0;
  while (
    !state.players[nextIndex].isConnected &&
    !state.players[nextIndex].isBot &&
    attempts < playerCount
  ) {
    nextIndex = (nextIndex + 1) % playerCount;
    attempts++;
  }

  return {
    ...state,
    phase: "play-from-hand",
    currentPlayerIndex: nextIndex,
    turnState: emptyTurnState(),
  };
}

function allHandsEmpty(state: GameState): boolean {
  return state.players.every((p) => p.hand.length === 0);
}

function endDealAsNagari(state: GameState): GameState {
  return {
    ...state,
    phase: "finished",
    winner: null,
    nagariMultiplier: state.nagariMultiplier * 2,
  };
}

// ─── Client View Generation ────────────────────────────────────────────────

function toPlayerView(player: Player): PlayerView {
  return {
    id: player.id,
    name: player.name,
    handSize: player.hand.length,
    captured: player.captured,
    score: player.score,
    goCount: player.goCount,
    heundeumSets: player.heundeumSets,
    isBot: player.isBot,
    isConnected: player.isConnected,
    bombSkipsRemaining: player.bombSkipsRemaining,
  };
}

/**
 * Generate the client-visible game state for a specific player.
 * Hides other players' hands but shows all public information.
 */
export function toClientGameState(state: GameState, playerId: string): ClientGameState {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  const player = state.players[playerIndex];

  return {
    phase: state.phase,
    myHand: player?.hand ?? [],
    myId: playerId,
    players: state.players.map(toPlayerView),
    currentPlayerIndex: state.currentPlayerIndex,
    tableStacks: state.tableStacks,
    deckSize: state.deck.length,
    dealNumber: state.dealNumber,
    nagariMultiplier: state.nagariMultiplier,
    turnState: {
      handCard: state.turnState.handCard,
      stockCard: state.turnState.stockCard,
      capturedThisTurn: state.turnState.capturedThisTurn,
      specialEvents: state.turnState.specialEvents,
    },
    validActions: getValidActions(state),
    captureChoices: getCaptureChoices(state),
    winner: state.winner,
    config: state.config,
  };
}
