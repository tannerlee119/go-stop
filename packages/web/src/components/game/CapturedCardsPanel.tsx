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

/* ── Horizontal row of cards with a label ── */
interface CardStripProps {
  label: string;
  count: number;
  subtotal: number;
  accentColor: string;
  cards: Card[];
  size: "xs" | "sm";
}

function CardStrip({ label, count, subtotal, accentColor, cards, size }: CardStripProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span className={`text-[9px] font-bold ${accentColor}`}>{label}</span>
        <span className="text-[8px] text-white/40">{count}</span>
        {subtotal > 0 && (
          <span className={`text-[9px] font-bold ${accentColor}`}>+{subtotal}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-0.5">
        {cards.map((card) => (
          <HwatuCard key={card.id} card={card} disabled size={size} />
        ))}
      </div>
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
      <div className="rounded-lg bg-black/10 px-2 py-1">
        <p className="text-[10px] text-white/30">No captures yet</p>
      </div>
    );
  }

  const sortedRibbons = sortRibbons(captured.ribbons);
  const junkGroups = groupJunkByFive(captured.junk);
  const junkCount = breakdown.junkCount;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Score header */}
      <div className="flex items-center gap-2">
        <span className={`font-bold text-gold ${compact ? "text-xs" : "text-sm"}`}>{score}</span>
        <span className="text-[9px] text-white/40">pts</span>
        {goCount > 0 && (
          <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-gold">
            GO ×{goCount}
          </span>
        )}
      </div>

      {/* Card type strips */}
      <CardStrip
        label="光"
        count={captured.brights.length}
        subtotal={breakdown.brightScore}
        accentColor="text-amber-300"
        cards={captured.brights}
        size={cardSize}
      />
      <CardStrip
        label="열"
        count={captured.animals.length}
        subtotal={breakdown.animalScore}
        accentColor="text-emerald-300"
        cards={captured.animals}
        size={cardSize}
      />
      <CardStrip
        label="띠"
        count={sortedRibbons.length}
        subtotal={breakdown.ribbonScore}
        accentColor="text-rose-300"
        cards={sortedRibbons}
        size={cardSize}
      />

      {/* Junk — grouped by 5 points, at the bottom */}
      {captured.junk.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-stone-300">피</span>
            <span className="text-[8px] text-white/40">{junkCount}</span>
            {breakdown.junkScore > 0 && (
              <span className="text-[9px] font-bold text-stone-300">+{breakdown.junkScore}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
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
  );
}
