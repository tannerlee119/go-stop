import type { Card, CapturedCards, Month, TableStack } from "./types.js";

export interface MatchResult {
  type: "no-match" | "single-match" | "double-match" | "triple-match";
  matchingStacks: TableStack[];
}

/**
 * Find stacks in the table layout that match the given card's month.
 */
export function findMatches(card: Card, tableStacks: TableStack[]): MatchResult {
  const matching = tableStacks.filter((s) => s.month === card.month);

  if (matching.length === 0) {
    return { type: "no-match", matchingStacks: [] };
  }

  const hasTriple = matching.some((s) => s.cards.length >= 3);
  if (hasTriple) {
    return { type: "triple-match", matchingStacks: matching.filter((s) => s.cards.length >= 3) };
  }

  if (matching.length >= 2) {
    return { type: "double-match", matchingStacks: matching };
  }

  return { type: "single-match", matchingStacks: matching };
}

/**
 * Apply a card to the table, capturing if there's a match.
 * Returns the updated table stacks and any captured cards.
 *
 * When there's a single match or triple, capture automatically.
 * When there's a double match, the caller must choose which to capture.
 */
export interface CaptureResult {
  updatedStacks: TableStack[];
  captured: Card[];
  needsChoice: boolean;
  choiceOptions: Card[];
  createdPpuk: boolean;
}

/**
 * Play a card onto the table. If the card matches a single stack or triple,
 * capture happens automatically. If two separate stacks match, the player
 * must choose. If no match, the card is added to the layout.
 */
export function playCardToTable(
  card: Card,
  tableStacks: TableStack[],
  chosenTargetId?: string,
): CaptureResult {
  const match = findMatches(card, tableStacks);

  switch (match.type) {
    case "no-match":
      return {
        updatedStacks: [...tableStacks, { month: card.month, cards: [card] }],
        captured: [],
        needsChoice: false,
        choiceOptions: [],
        createdPpuk: false,
      };

    case "single-match": {
      const stack = match.matchingStacks[0];
      if (stack.cards.length === 1) {
        // Pair: place card on top, will be resolved when stock card is drawn
        return {
          updatedStacks: tableStacks.map((s) =>
            s === stack ? { ...s, cards: [...s.cards, card] } : s,
          ),
          captured: [],
          needsChoice: false,
          choiceOptions: [],
          createdPpuk: false,
        };
      }
      // Stack of 2 from earlier pairing: place on top, wait for resolution
      return {
        updatedStacks: tableStacks.map((s) =>
          s === stack ? { ...s, cards: [...s.cards, card] } : s,
        ),
        captured: [],
        needsChoice: false,
        choiceOptions: [],
        createdPpuk: false,
      };
    }

    case "double-match": {
      if (!chosenTargetId) {
        const options = match.matchingStacks.flatMap((s) => s.cards);
        return {
          updatedStacks: tableStacks,
          captured: [],
          needsChoice: true,
          choiceOptions: options,
          createdPpuk: false,
        };
      }
      const targetStack = match.matchingStacks.find((s) =>
        s.cards.some((c) => c.id === chosenTargetId),
      );
      if (!targetStack) {
        throw new Error(`Invalid capture target: ${chosenTargetId}`);
      }
      // Place card on the chosen stack
      return {
        updatedStacks: tableStacks.map((s) =>
          s === targetStack ? { ...s, cards: [...s.cards, card] } : s,
        ),
        captured: [],
        needsChoice: false,
        choiceOptions: [],
        createdPpuk: false,
      };
    }

    case "triple-match": {
      const stack = match.matchingStacks[0];
      const captured = [...stack.cards, card];
      return {
        updatedStacks: tableStacks.filter((s) => s !== stack),
        captured,
        needsChoice: false,
        choiceOptions: [],
        createdPpuk: false,
      };
    }
  }
}

/**
 * Resolve the stock card draw phase. This handles the complex interaction
 * between the hand card placement and the stock card draw.
 */
export interface StockResolveResult {
  updatedStacks: TableStack[];
  captured: Card[];
  needsChoice: boolean;
  choiceOptions: Card[];
  isPpuk: boolean;
  isChok: boolean;
  isTtadak: boolean;
  isSseul: boolean;
}

export function resolveStockCard(
  stockCard: Card,
  handCard: Card,
  tableStacks: TableStack[],
  chosenTargetId?: string,
): StockResolveResult {
  const match = findMatches(stockCard, tableStacks);
  const handStack = tableStacks.find(
    (s) => s.month === handCard.month && s.cards.some((c) => c.id === handCard.id),
  );

  const sameMonthAsHand = stockCard.month === handCard.month;

  if (match.type === "no-match") {
    // Stock card doesn't match anything
    let captured: Card[] = [];
    let updatedStacks = [...tableStacks, { month: stockCard.month, cards: [stockCard] }];

    // Check if hand card made a pair that should be captured
    if (handStack && handStack.cards.length === 2) {
      captured = [...handStack.cards];
      updatedStacks = updatedStacks.filter((s) => s !== handStack);
    }

    const isSseul =
      captured.length > 0 && updatedStacks.filter((s) => s.month !== stockCard.month).length === 0;

    return {
      updatedStacks,
      captured,
      needsChoice: false,
      choiceOptions: [],
      isPpuk: false,
      isChok: false,
      isTtadak: false,
      isSseul,
    };
  }

  if (match.type === "triple-match") {
    // Stock card captures a triple stack
    const tripleStack = match.matchingStacks[0];
    let captured = [...tripleStack.cards, stockCard];
    let updatedStacks = tableStacks.filter((s) => s !== tripleStack);

    // Also capture the hand pair if it exists
    if (handStack && handStack !== tripleStack && handStack.cards.length >= 2) {
      captured = [...captured, ...handStack.cards];
      updatedStacks = updatedStacks.filter((s) => s !== handStack);
    }

    return {
      updatedStacks,
      captured,
      needsChoice: false,
      choiceOptions: [],
      isPpuk: true,
      isChok: false,
      isTtadak: false,
      isSseul: false,
    };
  }

  if (sameMonthAsHand && handStack) {
    // Stock card is the same month as the hand card
    if (handStack.cards.length === 2) {
      // Hand made a pair, stock is the third card of same month → ppuk
      return {
        updatedStacks: tableStacks.map((s) =>
          s === handStack ? { ...s, cards: [...s.cards, stockCard] } : s,
        ),
        captured: [],
        needsChoice: false,
        choiceOptions: [],
        isPpuk: true,
        isChok: false,
        isTtadak: false,
        isSseul: false,
      };
    }
    if (handStack.cards.length === 3) {
      // Hand card was placed on a pair, now stock completes the set → ttadak
      const captured = [...handStack.cards, stockCard];
      const updatedStacks = tableStacks.filter((s) => s !== handStack);

      return {
        updatedStacks,
        captured,
        needsChoice: false,
        choiceOptions: [],
        isPpuk: false,
        isChok: false,
        isTtadak: true,
        isSseul: false,
      };
    }
  }

  // Stock card matches a different stack
  if (match.type === "single-match") {
    const stockTargetStack = match.matchingStacks[0];

    let captured: Card[] = [];
    let updatedStacks = [...tableStacks];

    // Capture the hand card pair if applicable
    if (handStack && handStack.cards.length === 2 && handStack !== stockTargetStack) {
      captured.push(...handStack.cards);
      updatedStacks = updatedStacks.filter((s) => s !== handStack);
    }

    // Capture the stock match
    if (stockTargetStack.cards.length === 1) {
      captured.push(...stockTargetStack.cards, stockCard);
      updatedStacks = updatedStacks.filter((s) => s !== stockTargetStack);
    } else if (stockTargetStack.cards.length >= 2) {
      captured.push(...stockTargetStack.cards, stockCard);
      updatedStacks = updatedStacks.filter((s) => s !== stockTargetStack);
    }

    // Check for chok: hand card didn't match but stock captured it
    const isChok =
      !handStack?.cards.some((c) => c.id !== handCard.id) &&
      stockCard.month === handCard.month;

    const isSseul = captured.length > 0 && updatedStacks.length === 0;

    return {
      updatedStacks,
      captured,
      needsChoice: false,
      choiceOptions: [],
      isPpuk: false,
      isChok,
      isTtadak: false,
      isSseul,
    };
  }

  if (match.type === "double-match") {
    if (!chosenTargetId) {
      // Need to choose which card to capture with stock card
      let captureFromHand: Card[] = [];
      let stacksAfterHand = [...tableStacks];

      if (handStack && handStack.cards.length === 2) {
        const handPairStacks = match.matchingStacks.filter((s) => s !== handStack);
        if (handPairStacks.length > 0) {
          captureFromHand = [...handStack.cards];
          stacksAfterHand = stacksAfterHand.filter((s) => s !== handStack);
        }
      }

      const options = match.matchingStacks
        .filter((s) => s !== handStack || handStack.cards.length !== 2)
        .flatMap((s) => s.cards);

      return {
        updatedStacks: tableStacks,
        captured: captureFromHand,
        needsChoice: true,
        choiceOptions: options,
        isPpuk: false,
        isChok: false,
        isTtadak: false,
        isSseul: false,
      };
    }

    const targetStack = match.matchingStacks.find((s) =>
      s.cards.some((c) => c.id === chosenTargetId),
    );
    if (!targetStack) {
      throw new Error(`Invalid stock capture target: ${chosenTargetId}`);
    }

    let captured = [...targetStack.cards, stockCard];
    let updatedStacks = tableStacks.filter((s) => s !== targetStack);

    if (handStack && handStack.cards.length === 2 && handStack !== targetStack) {
      captured = [...captured, ...handStack.cards];
      updatedStacks = updatedStacks.filter((s) => s !== handStack);
    }

    const isSseul = updatedStacks.length === 0;

    return {
      updatedStacks,
      captured,
      needsChoice: false,
      choiceOptions: [],
      isPpuk: false,
      isChok: false,
      isTtadak: false,
      isSseul,
    };
  }

  // Fallback: shouldn't reach here
  return {
    updatedStacks: tableStacks,
    captured: [],
    needsChoice: false,
    choiceOptions: [],
    isPpuk: false,
    isChok: false,
    isTtadak: false,
    isSseul: false,
  };
}

/**
 * Add captured cards to a player's capture area, sorted by type.
 */
export function addToCaptured(captured: CapturedCards, cards: Card[]): CapturedCards {
  const result = {
    brights: [...captured.brights],
    animals: [...captured.animals],
    ribbons: [...captured.ribbons],
    junk: [...captured.junk],
  };

  for (const card of cards) {
    switch (card.type) {
      case "bright":
        result.brights.push(card);
        break;
      case "animal":
        result.animals.push(card);
        break;
      case "ribbon":
        result.ribbons.push(card);
        break;
      case "junk":
        result.junk.push(card);
        break;
    }
  }

  return result;
}

/**
 * Check if a player has a bomb available (3 cards of same month in hand,
 * with the 4th on the table).
 */
export function findBombs(hand: Card[], tableStacks: TableStack[]): Month[] {
  const handMonths = new Map<Month, Card[]>();
  for (const card of hand) {
    const existing = handMonths.get(card.month) ?? [];
    existing.push(card);
    handMonths.set(card.month, existing);
  }

  const bombs: Month[] = [];
  for (const [month, cards] of handMonths) {
    if (cards.length === 3 && tableStacks.some((s) => s.month === month)) {
      bombs.push(month);
    }
  }

  return bombs;
}

/**
 * Check for quad in hand (4 cards of same month).
 */
export function findQuads(hand: Card[]): Month[] {
  const handMonths = new Map<Month, number>();
  for (const card of hand) {
    handMonths.set(card.month, (handMonths.get(card.month) ?? 0) + 1);
  }

  const quads: Month[] = [];
  for (const [month, count] of handMonths) {
    if (count === 4) quads.push(month);
  }

  return quads;
}

/**
 * Check for triples in hand (for heundeum declaration).
 */
export function findTriples(hand: Card[]): Month[] {
  const handMonths = new Map<Month, number>();
  for (const card of hand) {
    handMonths.set(card.month, (handMonths.get(card.month) ?? 0) + 1);
  }

  const triples: Month[] = [];
  for (const [month, count] of handMonths) {
    if (count >= 3) triples.push(month);
  }

  return triples;
}

/**
 * Surrender a junk card (for special events). The opponent chooses the
 * least valuable junk card available.
 */
export function surrenderJunk(captured: CapturedCards): {
  card: Card | null;
  remaining: CapturedCards;
} {
  if (captured.junk.length === 0) {
    return { card: null, remaining: captured };
  }

  // Prefer surrendering non-double junk first
  const sortedJunk = [...captured.junk].sort((a, b) => {
    const aVal = a.isDoubleJunk ? 2 : 1;
    const bVal = b.isDoubleJunk ? 2 : 1;
    return aVal - bVal;
  });

  const card = sortedJunk[0];
  return {
    card,
    remaining: {
      ...captured,
      junk: captured.junk.filter((c) => c.id !== card.id),
    },
  };
}
