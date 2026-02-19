"use client";

import type { PlayerView } from "@go-stop/shared";
import { CapturedCardsPanel } from "./CapturedCardsPanel";

interface OpponentBarProps {
  player: PlayerView;
  isActive: boolean;
  index: number;
}

const PLAYER_COLORS = [
  "from-crimson to-crimson-dark",
  "from-royal-blue to-royal-blue/80",
  "from-gold-dark to-gold",
];

export function OpponentBar({ player, isActive, index }: OpponentBarProps) {
  const gradient = PLAYER_COLORS[index % PLAYER_COLORS.length];

  return (
    <div
      className={`rounded-lg transition-all
        ${isActive ? "bg-white/15 ring-2 ring-gold/50" : "bg-white/5"}
      `}
    >
      {/* Player header */}
      <div className="flex items-center gap-2 px-2 pt-1.5 pb-1">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-bold text-white shadow`}
        >
          {player.isBot ? "🤖" : player.name[0].toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-[11px] font-medium text-white">
              {player.name}
            </p>
            {isActive && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            )}
          </div>
          <span className="text-[9px] text-white/40">
            Hand: {player.handSize}
          </span>
        </div>
      </div>

      {/* Opponent captured cards */}
      <div className="px-1.5 pb-1.5">
        <CapturedCardsPanel
          captured={player.captured}
          score={player.score}
          goCount={player.goCount}
          compact
        />
      </div>
    </div>
  );
}
