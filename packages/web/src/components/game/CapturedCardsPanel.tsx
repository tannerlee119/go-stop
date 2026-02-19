"use client";

import { calculateScore } from "@go-stop/shared";
import type { CapturedCards, Card, RibbonKind } from "@go-stop/shared";
import { HwatuCard } from "./HwatuCard";

interface CapturedCardsPanelProps {
  captured: CapturedCards;
  score: number;
  goCount: number;
  compact?: boolean;
}

const RIBBON_ORDER: Record<RibbonKind, number> = {
  "red-poem": 0,
  "blue": 1,
  "red-plain": 2,
  "other": 3,
};

function sortRibbons(ribbons: Card[]): Card[] {
  return [...ribbons].sort((a, b) => {
    const aOrder = RIBBON_ORDER[a.ribbonKind ?? "other"];
    const bOrder = RIBBON_ORDER[b.ribbonKind ?? "other"];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.month - b.month;
  });
}

function junkValue(card: Card): number {
  return card.isDoubleJunk ? 2 : 1;
}

function groupJunkByFive(junk: Card[]): Card[][] {
  const groups: Card[][] = [];
  let currentGroup: Card[] = [];
  let currentValue = 0;

  const sorted = [...junk].sort((a, b) => a.month - b.month);

  for (const card of sorted) {
    const value = junkValue(card);
    if (currentValue + value > 5 && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
      currentValue = 0;
    }
    currentGroup.push(card);
    currentValue += value;
    if (currentValue >= 5) {
      groups.push(currentGroup);
      currentGroup = [];
      currentValue = 0;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // If a row has a +2 (double-junk) and the next row is incomplete, swap the +2
  // into the incomplete row so the last group is better filled.
  for (let i = 0; i < groups.length - 1; i++) {
    const nextGroup = groups[i + 1];
    const nextValue = nextGroup.reduce((sum, c) => sum + junkValue(c), 0);
    if (nextValue >= 5) continue;

    const doubleIdx = groups[i].findIndex((c) => c.isDoubleJunk);
    const singleIdx = nextGroup.findIndex((c) => !c.isDoubleJunk);
    if (doubleIdx !== -1 && singleIdx !== -1) {
      const doubleCard = groups[i][doubleIdx];
      const singleCard = nextGroup[singleIdx];
      groups[i] = groups[i].map((c, j) => (j === doubleIdx ? singleCard : c));
      groups[i + 1] = nextGroup.map((c, j) => (j === singleIdx ? doubleCard : c));
    }
  }

  return groups;
}

interface CardRowProps {
  label: string;
  koreanLabel: string;
  cards: Card[];
  subtotal: number;
  accentColor: string;
  size: "xs" | "sm";
  compact: boolean;
}

function CardRow({ label, koreanLabel, cards, subtotal, accentColor, size, compact }: CardRowProps) {
  if (cards.length === 0 && compact) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "min-h-[16px]" : "min-h-[28px]"}`}>
      <div className={`flex w-8 flex-shrink-0 flex-col items-center ${compact ? "gap-0" : "gap-0.5"}`}>
        <span className={`font-bold ${accentColor} ${compact ? "text-[9px]" : "text-[11px]"}`}>
          {koreanLabel}
        </span>
      </div>

      {cards.length > 0 ? (
        <div className="flex flex-wrap gap-0.5">
          {cards.map((card) => (
            <HwatuCard key={card.id} card={card} disabled size={size} />
          ))}
        </div>
      ) : (
        <span className={`text-white/20 ${compact ? "text-[8px]" : "text-[10px]"}`}>—</span>
      )}

      {subtotal > 0 && (
        <span className={`ml-auto flex-shrink-0 font-bold ${accentColor} ${compact ? "text-[9px]" : "text-[11px]"}`}>
          +{subtotal}
        </span>
      )}
    </div>
  );
}

export function CapturedCardsPanel({
  captured,
  score,
  goCount,
  compact = false,
}: CapturedCardsPanelProps) {
  const cardSize = compact ? "xs" : "sm";
  const totalCards =
    captured.brights.length +
    captured.animals.length +
    captured.ribbons.length +
    captured.junk.length;

  const breakdown = calculateScore(captured);

  if (totalCards === 0) {
    return (
      <div className={`rounded-lg bg-black/10 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
        <p className="text-[11px] text-white/30">No captures yet</p>
      </div>
    );
  }

  const sortedRibbons = sortRibbons(captured.ribbons);
  const junkGroups = groupJunkByFive(captured.junk);
  const junkValue = breakdown.junkCount;

  return (
    <div className={`rounded-lg bg-black/15 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
      {/* Score header */}
      <div className={`flex items-center gap-2 ${compact ? "mb-1" : "mb-1.5"}`}>
        <span className={`font-bold text-gold ${compact ? "text-xs" : "text-sm"}`}>{score}</span>
        <span className="text-[10px] text-white/40">pts</span>
        {goCount > 0 && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
            GO ×{goCount}
          </span>
        )}
      </div>

      {/* Main grid: type rows on left, junk column on right */}
      <div className="flex gap-3">
        {/* Left: brights, animals, ribbons rows */}
        <div className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
          <CardRow
            label="Brights"
            koreanLabel="光"
            cards={captured.brights}
            subtotal={breakdown.brightScore}
            accentColor="text-amber-300"
            size={cardSize}
            compact={compact}
          />
          <CardRow
            label="Animals"
            koreanLabel="열"
            cards={captured.animals}
            subtotal={breakdown.animalScore}
            accentColor="text-emerald-300"
            size={cardSize}
            compact={compact}
          />
          <CardRow
            label="Ribbons"
            koreanLabel="띠"
            cards={sortedRibbons}
            subtotal={breakdown.ribbonScore}
            accentColor="text-rose-300"
            size={cardSize}
            compact={compact}
          />
        </div>

        {/* Right: junk column grouped by 5 points */}
        {captured.junk.length > 0 && (
          <div className={`flex flex-shrink-0 flex-col items-center ${compact ? "gap-1" : "gap-1.5"}`}>
            <div className="flex items-center gap-1">
              <span className={`font-bold text-stone-300 ${compact ? "text-[9px]" : "text-[11px]"}`}>
                피
              </span>
              <span className={`text-white/40 ${compact ? "text-[8px]" : "text-[10px]"}`}>
                {junkValue}
              </span>
              {breakdown.junkScore > 0 && (
                <span className={`font-bold text-stone-300 ${compact ? "text-[9px]" : "text-[11px]"}`}>
                  +{breakdown.junkScore}
                </span>
              )}
            </div>
            <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
              {junkGroups.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className="flex flex-wrap gap-0.5 rounded bg-black/10 p-0.5"
                >
                  {group.map((card) => (
                    <HwatuCard key={card.id} card={card} disabled size={cardSize} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
