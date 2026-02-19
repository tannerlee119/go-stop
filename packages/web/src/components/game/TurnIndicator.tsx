"use client";

import type { ClientGameState } from "@go-stop/shared";

interface TurnIndicatorProps {
  state: ClientGameState;
  isMyTurn: boolean;
  onClick?: () => void;
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

export function TurnIndicator({ state, isMyTurn, onClick }: TurnIndicatorProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return null;

  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;
  const isClickable = !!onClick;

  return (
    <div className="text-center">
      <div
        role={isClickable ? "button" : undefined}
        onClick={onClick}
        className={`inline-block rounded-full px-5 py-1.5 text-sm font-medium shadow
          ${isMyTurn
            ? "bg-gold text-white animate-pulse-glow"
            : "bg-white/10 text-white/70"
          }
          ${isClickable
            ? "cursor-pointer ring-2 ring-white/40 hover:ring-white/70 hover:scale-105 transition-all"
            : ""
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
