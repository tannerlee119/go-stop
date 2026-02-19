import {
  CHEONG_DAN_MONTHS,
  CHO_DAN_MONTHS,
  GODORI_MONTHS,
  HONG_DAN_MONTHS,
  RAIN_MONTH,
  ANIMAL_THRESHOLD,
  RIBBON_THRESHOLD,
  JUNK_THRESHOLD,
  MEOUNG_DDA_THRESHOLD,
  PI_BAK_THRESHOLD,
} from "./constants.js";
import type {
  Card,
  CapturedCards,
  PaymentMultiplier,
  Player,
  ScoreBreakdown,
} from "./types.js";

/** Count junk value considering double-junk and sake cup used as junk. */
export function countJunkValue(junk: Card[], sakeCupAsJunk: boolean, sakeCup: Card | null): number {
  let count = 0;
  for (const card of junk) {
    count += card.isDoubleJunk ? 2 : 1;
  }
  if (sakeCupAsJunk && sakeCup) {
    count += 2;
  }
  return count;
}

/**
 * Calculate the complete score breakdown for a player's captured cards.
 *
 * The sake cup (September animal) can count as either an animal or 2 junk.
 * We compute both possibilities and pick whichever yields a higher total.
 */
export function calculateScore(captured: CapturedCards): ScoreBreakdown {
  const sakeCup = captured.animals.find((c) => c.isSakeCup) ?? null;

  const withSakeCupAsAnimal = computeBreakdown(captured, false, sakeCup);
  const withSakeCupAsJunk = computeBreakdown(captured, true, sakeCup);

  return withSakeCupAsAnimal.total >= withSakeCupAsJunk.total
    ? withSakeCupAsAnimal
    : withSakeCupAsJunk;
}

function computeBreakdown(
  captured: CapturedCards,
  sakeCupAsJunk: boolean,
  sakeCup: Card | null,
): ScoreBreakdown {
  const brightScore = computeBrightScore(captured.brights);
  const brightSetSize = captured.brights.length;

  const animalCount = sakeCupAsJunk
    ? captured.animals.filter((c) => !c.isSakeCup).length
    : captured.animals.length;
  const godori = hasGodori(captured.animals, sakeCupAsJunk);
  const animalScore = computeAnimalScore(animalCount, godori);

  const ribbonCount = captured.ribbons.length;
  const hongDan = hasRibbonSet(captured.ribbons, HONG_DAN_MONTHS);
  const cheongDan = hasRibbonSet(captured.ribbons, CHEONG_DAN_MONTHS);
  const choDan = hasRibbonSet(captured.ribbons, CHO_DAN_MONTHS);
  const ribbonScore = computeRibbonScore(ribbonCount, hongDan, cheongDan, choDan);

  const junkCount = countJunkValue(captured.junk, sakeCupAsJunk, sakeCup);
  const junkScore = computeJunkScore(junkCount);

  return {
    total: brightScore + animalScore + ribbonScore + junkScore,
    brightScore,
    brightSetSize,
    animalScore,
    animalCount,
    godori,
    ribbonScore,
    ribbonCount,
    hongDan,
    cheongDan,
    choDan,
    junkScore,
    junkCount,
  };
}

function computeBrightScore(brights: Card[]): number {
  const count = brights.length;
  if (count >= 5) return 15;
  if (count === 4) return 4;
  if (count === 3) {
    const hasRain = brights.some((c) => c.month === RAIN_MONTH);
    return hasRain ? 2 : 3;
  }
  return 0;
}

function hasGodori(animals: Card[], sakeCupAsJunk: boolean): boolean {
  const birdAnimals = animals.filter((c) => {
    if (sakeCupAsJunk && c.isSakeCup) return false;
    return c.isBird && c.month !== RAIN_MONTH;
  });
  return GODORI_MONTHS.every((m) => birdAnimals.some((c) => c.month === m));
}

function computeAnimalScore(count: number, godori: boolean): number {
  let score = 0;
  if (count >= ANIMAL_THRESHOLD) {
    score += 1 + (count - ANIMAL_THRESHOLD);
  }
  if (godori) score += 5;
  return score;
}

function hasRibbonSet(ribbons: Card[], months: number[]): boolean {
  return months.every((m) => ribbons.some((c) => c.month === m));
}

function computeRibbonScore(
  count: number,
  hongDan: boolean,
  cheongDan: boolean,
  choDan: boolean,
): number {
  let score = 0;
  if (count >= RIBBON_THRESHOLD) {
    score += 1 + (count - RIBBON_THRESHOLD);
  }
  if (hongDan) score += 3;
  if (cheongDan) score += 3;
  if (choDan) score += 3;
  return score;
}

function computeJunkScore(count: number): number {
  if (count >= JUNK_THRESHOLD) {
    return 1 + (count - JUNK_THRESHOLD);
  }
  return 0;
}

/**
 * Calculate payment multipliers for the winner.
 */
export function calculatePaymentMultipliers(
  winner: Player,
  loser: Player,
  winnerScore: ScoreBreakdown,
  loserScore: ScoreBreakdown,
  nagariMultiplier: number,
): PaymentMultiplier[] {
  const multipliers: PaymentMultiplier[] = [];

  if (nagariMultiplier > 1) {
    multipliers.push({
      reason: `Nagari (×${nagariMultiplier})`,
      multiplier: nagariMultiplier,
    });
  }

  if (winner.goCount >= 3) {
    const extraDoubles = winner.goCount - 2;
    for (let i = 0; i < extraDoubles; i++) {
      multipliers.push({ reason: `Go #${i + 3} double`, multiplier: 2 });
    }
  }

  if (winnerScore.junkCount >= JUNK_THRESHOLD && loserScore.junkCount < PI_BAK_THRESHOLD) {
    multipliers.push({ reason: "Pi-bak (fewer than 5 junk)", multiplier: 2 });
  }

  if (winnerScore.animalCount >= MEOUNG_DDA_THRESHOLD) {
    multipliers.push({ reason: "Meoung-dda (7+ animals)", multiplier: 2 });
  }

  if (winnerScore.brightScore > 0 && loser.captured.brights.length === 0) {
    multipliers.push({ reason: "Guang-bak (no brights)", multiplier: 2 });
  }

  for (let i = 0; i < winner.heundeumSets.length; i++) {
    multipliers.push({ reason: "Heundeum declaration", multiplier: 2 });
  }

  return multipliers;
}

/**
 * Calculate the final chip payment from a loser to the winner.
 */
export function calculatePayment(
  winnerScore: number,
  goCount: number,
  multipliers: PaymentMultiplier[],
): number {
  let basePayment = winnerScore;

  // Add chips for Go calls
  if (goCount >= 1 && goCount < 3) {
    basePayment += goCount;
  }

  // Apply all multipliers
  let totalMultiplier = 1;
  for (const m of multipliers) {
    totalMultiplier *= m.multiplier;
  }

  return basePayment * totalMultiplier;
}
