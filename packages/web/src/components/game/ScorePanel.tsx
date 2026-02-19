"use client";

import type { PlayerView } from "@go-stop/shared";
import { CapturedCardsPanel } from "./CapturedCardsPanel";

interface ScorePanelProps {
  player: PlayerView;
}

export function ScorePanel({ player }: ScorePanelProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-white/40">
          My Captures
        </span>
      </div>
      <CapturedCardsPanel
        captured={player.captured}
        score={player.score}
        goCount={player.goCount}
      />
    </div>
  );
}
