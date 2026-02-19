"use client";

import type { PlayerView } from "@go-stop/shared";

interface ScorePanelProps {
  player: PlayerView;
}

export function ScorePanel({ player }: ScorePanelProps) {
  const { captured } = player;

  return (
    <div className="w-full max-w-3xl rounded-lg bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="font-medium text-white/80">
            My Captures
          </span>

          {captured.brights.length > 0 && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">
              光 {captured.brights.length}
            </span>
          )}

          {captured.animals.length > 0 && (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
              열 {captured.animals.length}
            </span>
          )}

          {captured.ribbons.length > 0 && (
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-rose-300">
              띠 {captured.ribbons.length}
            </span>
          )}

          {captured.junk.length > 0 && (
            <span className="rounded bg-stone-500/20 px-2 py-0.5 text-stone-300">
              피 {captured.junk.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gold">{player.score}</span>
          <span className="text-xs text-white/40">pts</span>
          {player.goCount > 0 && (
            <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
              GO ×{player.goCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
