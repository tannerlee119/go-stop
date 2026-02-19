import type { CardDefinition, Month } from "./types.js";

function bright(month: Month, flower: string, name: string): CardDefinition {
  return { id: `${month}-bright`, month, type: "bright", name, flower };
}

function animal(
  month: Month,
  flower: string,
  name: string,
  extra?: Partial<CardDefinition>,
): CardDefinition {
  return { id: `${month}-animal`, month, type: "animal", name, flower, ...extra };
}

function ribbon(
  month: Month,
  flower: string,
  name: string,
  ribbonKind: CardDefinition["ribbonKind"],
): CardDefinition {
  return { id: `${month}-ribbon`, month, type: "ribbon", name, flower, ribbonKind };
}

function junk(
  month: Month,
  flower: string,
  index: number,
  extra?: Partial<CardDefinition>,
): CardDefinition {
  return {
    id: `${month}-junk-${index}`,
    month,
    type: "junk",
    name: `${flower} Junk`,
    flower,
    ...extra,
  };
}

/**
 * Complete definition of the 48-card hwatu deck used in Go-Stop.
 *
 * Month distribution:
 *   - Months 1,3: Bright + Ribbon + 2 Junk
 *   - Month 8: Bright + Animal + 2 Junk
 *   - Months 2,4,5,6,7,9,10: Animal + Ribbon + 2 Junk
 *   - Month 11: Bright + 3 Junk (one double-junk)
 *   - Month 12: Bright + Animal + Ribbon + 1 Junk (double-junk)
 */
export const ALL_CARDS: CardDefinition[] = [
  // ─── Month 1: Pine (송학) ───
  bright(1, "Pine", "Crane & Sun"),
  ribbon(1, "Pine", "Red Poem Ribbon", "red-poem"),
  junk(1, "Pine", 1),
  junk(1, "Pine", 2),

  // ─── Month 2: Plum (매화) ───
  animal(2, "Plum", "Nightingale", { isBird: true }),
  ribbon(2, "Plum", "Red Poem Ribbon", "red-poem"),
  junk(2, "Plum", 1),
  junk(2, "Plum", 2),

  // ─── Month 3: Cherry (벚꽃) ───
  bright(3, "Cherry", "Cherry Curtain"),
  ribbon(3, "Cherry", "Red Poem Ribbon", "red-poem"),
  junk(3, "Cherry", 1),
  junk(3, "Cherry", 2),

  // ─── Month 4: Wisteria (등나무) ───
  animal(4, "Wisteria", "Cuckoo", { isBird: true }),
  ribbon(4, "Wisteria", "Red Plain Ribbon", "red-plain"),
  junk(4, "Wisteria", 1),
  junk(4, "Wisteria", 2),

  // ─── Month 5: Iris (난초) ───
  animal(5, "Iris", "Bridge"),
  ribbon(5, "Iris", "Red Plain Ribbon", "red-plain"),
  junk(5, "Iris", 1),
  junk(5, "Iris", 2),

  // ─── Month 6: Peony (모란) ───
  animal(6, "Peony", "Butterflies"),
  ribbon(6, "Peony", "Blue Ribbon", "blue"),
  junk(6, "Peony", 1),
  junk(6, "Peony", 2),

  // ─── Month 7: Bush Clover (싸리) ───
  animal(7, "Bush Clover", "Boar"),
  ribbon(7, "Bush Clover", "Red Plain Ribbon", "red-plain"),
  junk(7, "Bush Clover", 1),
  junk(7, "Bush Clover", 2),

  // ─── Month 8: Pampas (공산) ───
  bright(8, "Pampas", "Full Moon"),
  animal(8, "Pampas", "Geese", { isBird: true }),
  junk(8, "Pampas", 1),
  junk(8, "Pampas", 2),

  // ─── Month 9: Chrysanthemum (국화) ───
  animal(9, "Chrysanthemum", "Sake Cup", { isSakeCup: true }),
  ribbon(9, "Chrysanthemum", "Blue Ribbon", "blue"),
  junk(9, "Chrysanthemum", 1),
  junk(9, "Chrysanthemum", 2),

  // ─── Month 10: Maple (단풍) ───
  animal(10, "Maple", "Deer"),
  ribbon(10, "Maple", "Blue Ribbon", "blue"),
  junk(10, "Maple", 1),
  junk(10, "Maple", 2),

  // ─── Month 11: Paulownia (오동) ───
  bright(11, "Paulownia", "Phoenix"),
  junk(11, "Paulownia", 1, { isDoubleJunk: true, name: "Double Junk" }),
  junk(11, "Paulownia", 2),
  junk(11, "Paulownia", 3),

  // ─── Month 12: Willow / Rain (비) ───
  bright(12, "Willow", "Rain Man"),
  animal(12, "Willow", "Swallow", { isBird: true }),
  ribbon(12, "Willow", "Willow Ribbon", "other"),
  junk(12, "Willow", 1, { isDoubleJunk: true, name: "Double Junk" }),
];

export function getCardById(id: string): CardDefinition | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function getCardsByMonth(month: Month): CardDefinition[] {
  return ALL_CARDS.filter((c) => c.month === month);
}

export function getCardsByType(type: CardDefinition["type"]): CardDefinition[] {
  return ALL_CARDS.filter((c) => c.type === type);
}
