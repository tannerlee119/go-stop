import { ALL_CARDS } from "./cards.js";
import type { Card, CardDefinition, Month, TableStack } from "./types.js";

function toCard(def: CardDefinition, faceUp = false): Card {
  return { ...def, faceUp };
}

/** Fisher-Yates shuffle, returns a new array. */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createDeck(): Card[] {
  return shuffle(ALL_CARDS.map((def) => toCard(def)));
}

export interface DealResult {
  hands: Card[][];
  tableCards: Card[];
  stock: Card[];
}

/**
 * Deal cards according to Go-Stop rules.
 *
 * 2 players: 10 cards each, 8 to table
 *   Pattern: 5-5-4, 5-5-4
 *
 * 3 players: 7 cards each, 6 to table
 *   Pattern: 4-4-4-3, 3-3-3-3
 *
 * 4 players: uses 3-player deal (gwangpalli) but for simplicity
 *   in the online version we deal 5 each, 8 to table.
 */
export function deal(playerCount: number): DealResult {
  const deck = createDeck();
  let idx = 0;

  function draw(count: number): Card[] {
    const cards = deck.slice(idx, idx + count);
    idx += count;
    return cards;
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let tableCards: Card[] = [];

  if (playerCount === 2) {
    // Round 1: 5 to each player, 4 to table
    hands[1].push(...draw(5));
    hands[0].push(...draw(5));
    tableCards.push(...draw(4));
    // Round 2: 5 to each player, 4 to table
    hands[1].push(...draw(5));
    hands[0].push(...draw(5));
    tableCards.push(...draw(4));
  } else {
    // 3 or 4 players: deal as 3-player game
    const activePlayers = Math.min(playerCount, 3);
    // Round 1: 4 to each player, 3 to table
    for (let p = 0; p < activePlayers; p++) hands[p].push(...draw(4));
    tableCards.push(...draw(3));
    // Round 2: 3 to each player, 3 to table
    for (let p = 0; p < activePlayers; p++) hands[p].push(...draw(3));
    tableCards.push(...draw(3));
  }

  // Mark table cards as face up
  tableCards = tableCards.map((c) => ({ ...c, faceUp: true }));

  // Remaining cards form the stock
  const stock = deck.slice(idx);

  return { hands, tableCards, stock };
}

/**
 * Group face-up table cards into stacks by month.
 * Cards of the same month are placed together.
 */
export function groupIntoStacks(tableCards: Card[]): TableStack[] {
  const byMonth = new Map<Month, Card[]>();

  for (const card of tableCards) {
    const existing = byMonth.get(card.month) ?? [];
    existing.push(card);
    byMonth.set(card.month, existing);
  }

  return Array.from(byMonth.entries()).map(([month, cards]) => ({
    month,
    cards,
  }));
}

export function drawFromStock(stock: Card[]): { drawn: Card; remaining: Card[] } | null {
  if (stock.length === 0) return null;
  const [drawn, ...remaining] = stock;
  return { drawn: { ...drawn, faceUp: true }, remaining };
}
