"use client";

import type { ClientGameState } from "@go-stop/shared";
import { HwatuCard } from "./HwatuCard";
import { useGameStore } from "@/stores/game-store";
import { useState } from "react";

interface PlayerHandProps {
  state: ClientGameState;
}

export function PlayerHand({ state }: PlayerHandProps) {
  const { sendAction } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myId;
  const canPlay =
    isMyTurn &&
    state.phase === "play-from-hand" &&
    state.validActions.includes("play-card");
  const canSkip =
    isMyTurn && state.validActions.includes("skip-hand");

  function handleCardClick(cardId: string) {
    if (!canPlay) return;
    sendAction({ type: "play-card", cardId });
    setSelectedCard(null);
  }

  function handleSkip() {
    if (!canSkip) return;
    sendAction({ type: "skip-hand" });
  }

  const sortedHand = [...state.myHand].sort((a, b) => a.month - b.month || a.type.localeCompare(b.type));

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">
            Your Hand ({state.myHand.length})
          </span>
          {canSkip && (
            <button
              onClick={handleSkip}
              className="rounded bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:bg-white/20"
            >
              Skip (bomb remaining)
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {sortedHand.map((card) => (
            <HwatuCard
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card.id)}
              disabled={!canPlay}
              selected={selectedCard === card.id}
            />
          ))}

          {state.myHand.length === 0 && (
            <p className="py-4 text-sm text-white/30">No cards in hand</p>
          )}
        </div>
      </div>
    </div>
  );
}
