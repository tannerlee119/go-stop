/**
 * Maps each card ID to its position in the 8×6 hwatu sprite sheet.
 *
 * The sprite is arranged as:
 *   Row 0: Month 1 (Pine) × 4,       Month 2 (Plum) × 4
 *   Row 1: Month 3 (Cherry) × 4,     Month 4 (Wisteria) × 4
 *   Row 2: Month 5 (Iris) × 4,       Month 6 (Peony) × 4
 *   Row 3: Month 7 (Bush Clover) × 4, Month 8 (Pampas) × 4
 *   Row 4: Month 9 (Chrysanthemum) × 4, Month 10 (Maple) × 4
 *   Row 5: Month 11 (Paulownia) × 4, Month 12 (Willow) × 4
 *
 * Within each month, cards are ordered: highest rank → lowest rank
 *   (bright/animal first, then ribbon, then junk)
 */

interface SpritePos {
  col: number;
  row: number;
}

const SPRITE_COLS = 8;
const SPRITE_ROWS = 6;

const CARD_POSITIONS: Record<string, SpritePos> = {
  // Month 1: Pine
  "1-bright":  { col: 0, row: 0 },
  "1-ribbon":  { col: 1, row: 0 },
  "1-junk-1":  { col: 2, row: 0 },
  "1-junk-2":  { col: 3, row: 0 },

  // Month 2: Plum
  "2-animal":  { col: 4, row: 0 },
  "2-ribbon":  { col: 5, row: 0 },
  "2-junk-1":  { col: 6, row: 0 },
  "2-junk-2":  { col: 7, row: 0 },

  // Month 3: Cherry
  "3-bright":  { col: 0, row: 1 },
  "3-ribbon":  { col: 1, row: 1 },
  "3-junk-1":  { col: 2, row: 1 },
  "3-junk-2":  { col: 3, row: 1 },

  // Month 4: Wisteria
  "4-animal":  { col: 4, row: 1 },
  "4-ribbon":  { col: 5, row: 1 },
  "4-junk-1":  { col: 6, row: 1 },
  "4-junk-2":  { col: 7, row: 1 },

  // Month 5: Iris
  "5-animal":  { col: 0, row: 2 },
  "5-ribbon":  { col: 1, row: 2 },
  "5-junk-1":  { col: 2, row: 2 },
  "5-junk-2":  { col: 3, row: 2 },

  // Month 6: Peony
  "6-animal":  { col: 4, row: 2 },
  "6-ribbon":  { col: 5, row: 2 },
  "6-junk-1":  { col: 6, row: 2 },
  "6-junk-2":  { col: 7, row: 2 },

  // Month 7: Bush Clover
  "7-animal":  { col: 0, row: 3 },
  "7-ribbon":  { col: 1, row: 3 },
  "7-junk-1":  { col: 2, row: 3 },
  "7-junk-2":  { col: 3, row: 3 },

  // Month 8: Pampas
  "8-bright":  { col: 4, row: 3 },
  "8-animal":  { col: 5, row: 3 },
  "8-junk-1":  { col: 6, row: 3 },
  "8-junk-2":  { col: 7, row: 3 },

  // Month 9: Chrysanthemum
  "9-animal":  { col: 0, row: 4 },
  "9-ribbon":  { col: 1, row: 4 },
  "9-junk-1":  { col: 2, row: 4 },
  "9-junk-2":  { col: 3, row: 4 },

  // Month 10: Maple
  "10-animal": { col: 4, row: 4 },
  "10-ribbon": { col: 5, row: 4 },
  "10-junk-1": { col: 6, row: 4 },
  "10-junk-2": { col: 7, row: 4 },

  // Month 11: Paulownia
  "11-bright": { col: 0, row: 5 },
  "11-junk-1": { col: 1, row: 5 },
  "11-junk-2": { col: 2, row: 5 },
  "11-junk-3": { col: 3, row: 5 },

  // Month 12: Willow / Rain
  "12-bright": { col: 4, row: 5 },
  "12-animal": { col: 5, row: 5 },
  "12-ribbon": { col: 6, row: 5 },
  "12-junk-1": { col: 7, row: 5 },
};

/**
 * Get CSS background properties to display a specific card from the sprite.
 */
export function getCardSpriteStyle(cardId: string): React.CSSProperties {
  const pos = CARD_POSITIONS[cardId];
  if (!pos) {
    return {};
  }

  const bgX = pos.col * (100 / (SPRITE_COLS - 1));
  const bgY = pos.row * (100 / (SPRITE_ROWS - 1));

  return {
    backgroundImage: "url(/cards/hwatu-deck.png)",
    backgroundSize: `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`,
    backgroundPosition: `${bgX}% ${bgY}%`,
    backgroundRepeat: "no-repeat",
  };
}

export function hasSprite(cardId: string): boolean {
  return cardId in CARD_POSITIONS;
}
