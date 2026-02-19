"use client";

import type { CapturedCards, Card } from "@go-stop/shared";
import { HwatuCard } from "./HwatuCard";

interface CapturedCardsPanelProps {
  captured: CapturedCards;
  score: number;
  goCount: number;
  /** Smaller layout for opponents */
  compact?: boolean;
}

interface CardGroupProps {
  label: string;
  cards: Card[];
  count: number;
  accentColor: string;
  bgColor: string;
  size: "xs" | "sm" | "md";
}

function CardGroup({ label, cards, count, accentColor, bgColor, size }: CardGroupProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${bgColor} ${accentColor}`}>
          {label}
        </span>
        <span className="text-[10px] text-white/40">{count}</span>
      </div>
      <div className="flex flex-wrap gap-1">
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

  if (totalCards === 0) {
    return (
      <div className={`rounded-lg bg-black/10 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
        <p className="text-[11px] text-white/30">No captures yet</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-black/15 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
      {/* Score header */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-sm font-bold text-gold">{score}</span>
        <span className="text-[10px] text-white/40">pts</span>
        {goCount > 0 && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
            GO ×{goCount}
          </span>
        )}
      </div>

      {/* Card groups */}
      <div className={`flex flex-wrap ${compact ? "gap-3" : "gap-4"}`}>
        <CardGroup
          label="光"
          cards={captured.brights}
          count={captured.brights.length}
          accentColor="text-amber-300"
          bgColor="bg-amber-500/20"
          size={cardSize}
        />
        <CardGroup
          label="열"
          cards={captured.animals}
          count={captured.animals.length}
          accentColor="text-emerald-300"
          bgColor="bg-emerald-500/20"
          size={cardSize}
        />
        <CardGroup
          label="띠"
          cards={captured.ribbons}
          count={captured.ribbons.length}
          accentColor="text-rose-300"
          bgColor="bg-rose-500/20"
          size={cardSize}
        />
        <CardGroup
          label="피"
          cards={captured.junk}
          count={captured.junk.length}
          accentColor="text-stone-300"
          bgColor="bg-stone-500/20"
          size={cardSize}
        />
      </div>
    </div>
  );
}
