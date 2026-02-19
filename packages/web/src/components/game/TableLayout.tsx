"use client";

import type { ClientGameState, Month } from "@go-stop/shared";
import { motion, AnimatePresence } from "framer-motion";
import { HwatuCard } from "./HwatuCard";
import { useGameStore } from "@/stores/game-store";

interface TableLayoutProps {
  state: ClientGameState;
  draggingMonth?: Month | null;
}

export function TableLayout({ state, draggingMonth }: TableLayoutProps) {
  const { sendAction } = useGameStore();
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myId;
  const needsCaptureChoice =
    (state.phase === "choose-hand-capture" || state.phase === "choose-stock-capture") &&
    isMyTurn;
  const isDrawPhase = state.phase === "draw-from-stock";

  function handleTableCardClick(cardId: string) {
    if (!needsCaptureChoice) return;
    sendAction({ type: "choose-capture", targetCardId: cardId });
  }

  const isDragging = draggingMonth != null;
  const matchingMonths = isDragging
    ? state.tableStacks.filter((s) => s.month === draggingMonth).map((s) => s.month)
    : [];

  const hasTurnInfo = !!(state.turnState.handCard || state.turnState.stockCard);

  return (
    <div className="w-full max-w-5xl">
      {/* Capture choice hint */}
      {needsCaptureChoice && (
        <div className="mb-3 text-center">
          <span className="inline-block animate-pulse rounded-full bg-gold/20 px-4 py-1 text-sm font-medium text-gold">
            Choose a card to capture
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        {/* Table stacks */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {state.tableStacks.map((stack) => {
            const isDropTarget = matchingMonths.includes(stack.month);
            return (
              <div
                key={`stack-${stack.month}`}
                data-drop-month={stack.month}
                className={`relative flex flex-col items-center rounded-lg transition-all ${
                  isDropTarget ? "ring-2 ring-gold/70 bg-gold/10 scale-105" : ""
                }`}
              >
                <div className="relative">
                  {stack.cards.map((card, cardIdx) => {
                    const isChoice = state.captureChoices.some(
                      (c) => c.id === card.id,
                    );
                    return (
                      <div
                        key={card.id}
                        className={cardIdx > 0 ? "-mt-[72px]" : ""}
                        style={{ zIndex: cardIdx }}
                      >
                        <HwatuCard
                          card={card}
                          size="lg"
                          onClick={() => handleTableCardClick(card.id)}
                          disabled={!isChoice}
                          highlighted={isChoice}
                        />
                      </div>
                    );
                  })}
                </div>

                {stack.cards.length > 1 && (
                  <div className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white shadow">
                    {stack.cards.length}
                  </div>
                )}
              </div>
            );
          })}

          {/* Drop zone for "no match" when dragging */}
          {isDragging && matchingMonths.length === 0 && (
            <div
              data-drop-empty
              className="flex h-[108px] w-[72px] items-center justify-center rounded-lg border-2 border-dashed border-gold/50 bg-gold/10 text-[10px] text-gold/70"
            >
              Drop
            </div>
          )}

          {state.tableStacks.length === 0 && !isDragging && (
            <div className="rounded-lg border-2 border-dashed border-white/20 px-12 py-8 text-sm text-white/30">
              Table is empty
            </div>
          )}

          {state.tableStacks.length === 0 && isDragging && (
            <div
              data-drop-empty
              className="flex rounded-lg border-2 border-dashed border-gold/50 bg-gold/10 px-12 py-8 text-sm text-gold/70"
            >
              Drop here
            </div>
          )}
        </div>

        {/* Turn state info — to the right of table */}
        <AnimatePresence>
          {hasTurnInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center gap-3 rounded-xl bg-black/20 px-4 py-3"
            >
              {state.turnState.handCard && (
                <div className="text-center">
                  <p className="mb-1 text-[10px] text-white/50">Played</p>
                  <HwatuCard card={state.turnState.handCard} disabled size="sm" />
                </div>
              )}
              {state.turnState.stockCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotateY: 90 }}
                  animate={{ opacity: 1, scale: isDrawPhase ? 1.1 : 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="text-center"
                >
                  <p className={`mb-1 text-[10px] font-medium ${isDrawPhase ? "text-gold animate-pulse" : "text-white/50"}`}>
                    {isDrawPhase ? "Stock Draw" : "Drawn"}
                  </p>
                  <HwatuCard
                    card={state.turnState.stockCard}
                    disabled
                    size={isDrawPhase ? "md" : "sm"}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
