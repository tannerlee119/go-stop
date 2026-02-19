"use client";

import type { ClientGameState, Month } from "@go-stop/shared";
import { motion, type PanInfo } from "framer-motion";
import { HwatuCard } from "./HwatuCard";
import { useGameStore } from "@/stores/game-store";
import { useCallback, useRef } from "react";

interface PlayerHandProps {
  state: ClientGameState;
  onDragStart?: (cardId: string, month: Month) => void;
  onDragEnd?: (pointerX: number, pointerY: number) => void;
}

export function PlayerHand({ state, onDragStart, onDragEnd }: PlayerHandProps) {
  const { sendAction } = useGameStore();
  const wasDragging = useRef(false);

  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myId;
  const canPlay =
    isMyTurn &&
    state.phase === "play-from-hand" &&
    state.validActions.includes("play-card");
  const canSkip =
    isMyTurn && state.validActions.includes("skip-hand");

  function handleCardClick(cardId: string) {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    if (!canPlay) return;
    sendAction({ type: "play-card", cardId });
  }

  function handleSkip() {
    if (!canSkip) return;
    sendAction({ type: "skip-hand" });
  }

  const handleDragStart = useCallback((cardId: string, month: Month) => {
    wasDragging.current = true;
    onDragStart?.(cardId, month);
  }, [onDragStart]);

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onDragEnd?.(info.point.x, info.point.y);
  }, [onDragEnd]);

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
            <motion.div
              key={card.id}
              drag={canPlay}
              dragSnapToOrigin
              dragElastic={0.5}
              dragMomentum={false}
              onDragStart={() => handleDragStart(card.id, card.month)}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.1, zIndex: 50 }}
              style={{ zIndex: 1 }}
            >
              <HwatuCard
                card={card}
                onClick={() => handleCardClick(card.id)}
                disabled={!canPlay}
              />
            </motion.div>
          ))}

          {state.myHand.length === 0 && (
            <p className="py-4 text-sm text-white/30">No cards in hand</p>
          )}
        </div>
      </div>
    </div>
  );
}
