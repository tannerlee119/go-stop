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
      className={`flex-1 rounded-lg transition-all
        ${isActive ? "bg-white/15 ring-2 ring-gold/50" : "bg-white/5"}
      `}
    >
      {/* Player header */}
      <div className="flex items-center gap-3 px-3 pt-2 pb-1">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow`}
        >
          {player.isBot ? "🤖" : player.name[0].toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {player.name}
            </p>
            {isActive && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
            )}
          </div>
          <span className="text-[11px] text-white/40">
            Hand: {player.handSize}
          </span>
        </div>
      </div>

      {/* Opponent captured cards */}
      <div className="px-2 pb-2">
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
