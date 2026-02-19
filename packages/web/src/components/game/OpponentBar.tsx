"use client";

import type { PlayerView } from "@go-stop/shared";

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
  const totalCaptured =
    player.captured.brights.length +
    player.captured.animals.length +
    player.captured.ribbons.length +
    player.captured.junk.length;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all
        ${isActive ? "bg-white/15 ring-2 ring-gold/50" : "bg-white/5"}
      `}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow`}
      >
        {player.isBot ? "🤖" : player.name[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">
            {player.name}
          </p>
          {isActive && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span>🃏 {player.handSize}</span>
          <span>📥 {totalCaptured}</span>
          <span>⭐ {player.score}pts</span>
          {player.goCount > 0 && (
            <span className="font-bold text-gold">GO×{player.goCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
