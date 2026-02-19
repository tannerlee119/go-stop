"use client";

import type { ClientGameState } from "@go-stop/shared";

interface TurnIndicatorProps {
  state: ClientGameState;
  isMyTurn: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  "play-from-hand": "Play a card",
  "choose-hand-capture": "Choose capture",
  "draw-from-stock": "Drawing from stock...",
  "choose-stock-capture": "Choose capture",
  "go-stop-decision": "Go or Stop?",
  "resolve-captures": "Resolving...",
  finished: "Game Over",
};

export function TurnIndicator({ state, isMyTurn }: TurnIndicatorProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return null;

  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;

  return (
    <div className="text-center">
      <div
        className={`inline-block rounded-full px-5 py-1.5 text-sm font-medium shadow
          ${isMyTurn
            ? "bg-gold text-white animate-pulse-glow"
            : "bg-white/10 text-white/70"
          }`}
      >
        {isMyTurn ? (
          <>Your turn — {phaseLabel}</>
        ) : (
          <>{currentPlayer.name}&apos;s turn</>
        )}
      </div>
    </div>
  );
}
