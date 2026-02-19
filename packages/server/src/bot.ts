import {
  calculateScore,
  findBombs,
  findMatches,
  getValidActions,
} from "@go-stop/shared";
import type { Card, GameAction, GameState, TableStack } from "@go-stop/shared";

/**
 * Bot AI for single-player mode.
 *
 * Strategy priorities:
 * 1. Always capture bright cards when possible
 * 2. Prioritize completing scoring sets (godori, hongdan, etc.)
 * 3. Prefer capturing cards that add to existing captured sets
 * 4. Use bombs when advantageous
 * 5. Say "Go" if the score lead is comfortable, "Stop" if risky
 */
export function chooseBotAction(state: GameState): GameAction | null {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const validActions = getValidActions(state);

  if (validActions.length === 0) return null;

  if (validActions.includes("go") || validActions.includes("stop")) {
    return chooseGoOrStop(state);
  }

  if (validActions.includes("choose-capture")) {
    return chooseCaptureTarget(state);
  }

  if (validActions.includes("bomb") && shouldBomb(state)) {
    const bombs = findBombs(currentPlayer.hand, state.tableStacks);
    if (bombs.length > 0) {
      return { type: "bomb", month: bombs[0] };
    }
  }

  if (validActions.includes("skip-hand") && currentPlayer.hand.length === 0) {
    return { type: "skip-hand" };
  }

  if (validActions.includes("play-card")) {
    return chooseCardToPlay(state);
  }

  return null;
}

function chooseGoOrStop(state: GameState): GameAction {
  const player = state.players[state.currentPlayerIndex];
  const score = calculateScore(player.captured);

  // Conservative: stop at target or first reasonable score
  if (player.goCount >= 2) {
    return { type: "stop" };
  }

  // If we have a big lead and few opponents have high scores, go
  const opponentMaxScore = Math.max(
    ...state.players
      .filter((p) => p.id !== player.id)
      .map((p) => calculateScore(p.captured).total),
  );

  if (score.total >= state.config.targetScore + 3 && opponentMaxScore < state.config.targetScore - 1) {
    return { type: "go" };
  }

  if (score.total >= state.config.targetScore + 1 && player.goCount === 0 && state.deck.length > 10) {
    return { type: "go" };
  }

  return { type: "stop" };
}

function chooseCaptureTarget(state: GameState): GameAction {
  const turnCard = state.phase === "choose-hand-capture"
    ? state.turnState.handCard
    : state.turnState.stockCard;

  if (!turnCard) {
    return { type: "choose-capture", targetCardId: "" };
  }

  const matches = state.tableStacks.filter((s) => s.month === turnCard.month);
  const allTargets = matches.flatMap((s) => s.cards);

  // Rank targets by value
  const ranked = allTargets.sort((a, b) => cardValue(b) - cardValue(a));

  return {
    type: "choose-capture",
    targetCardId: ranked[0]?.id ?? allTargets[0]?.id ?? "",
  };
}

function chooseCardToPlay(state: GameState): GameAction {
  const player = state.players[state.currentPlayerIndex];
  const hand = player.hand;

  if (hand.length === 0) {
    return { type: "skip-hand" };
  }

  // Score each card in hand based on potential captures and strategy
  const scored = hand.map((card) => ({
    card,
    score: evaluatePlay(card, state),
  }));

  scored.sort((a, b) => b.score - a.score);

  return { type: "play-card", cardId: scored[0].card.id };
}

function evaluatePlay(card: Card, state: GameState): number {
  let score = 0;
  const matches = findMatches(card, state.tableStacks);

  if (matches.type === "no-match") {
    // Playing a card with no match is generally bad
    score -= 5;
    // But dumping junk is less bad
    if (card.type === "junk") score += 2;
    return score;
  }

  if (matches.type === "triple-match") {
    // Capturing a triple is excellent (we get 4 cards + ppuk bonus)
    score += 20;
  }

  // Value the matched cards
  for (const stack of matches.matchingStacks) {
    for (const tableCard of stack.cards) {
      score += cardValue(tableCard) * 3;
    }
  }

  // Value of the card itself being played (we lose it from hand)
  score += cardValue(card);

  return score;
}

function cardValue(card: Card): number {
  switch (card.type) {
    case "bright": return 10;
    case "animal": return card.isBird ? 6 : (card.isSakeCup ? 5 : 4);
    case "ribbon": return 3;
    case "junk": return card.isDoubleJunk ? 2 : 1;
  }
}

function shouldBomb(state: GameState): boolean {
  const player = state.players[state.currentPlayerIndex];
  const bombs = findBombs(player.hand, state.tableStacks);

  for (const month of bombs) {
    const tableStack = state.tableStacks.find((s) => s.month === month);
    if (!tableStack) continue;

    // Bomb if the table card is high-value
    const tableCardValue = tableStack.cards.reduce((sum, c) => sum + cardValue(c), 0);
    if (tableCardValue >= 5) return true;
  }

  return false;
}
