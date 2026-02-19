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
        {/* ── Stock / Draw Pile ── */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            Stock
          </span>

          <div className="relative">
            {/* Stacked card backs to show depth */}
            {state.deckSize > 2 && (
              <div className="absolute top-[3px] left-[3px]">
                <HwatuCard
                  card={{ id: "__pile3", month: 1, type: "junk", name: "", flower: "", faceUp: false } as any}
                  faceDown
                  size="lg"
                  disabled
                />
              </div>
            )}
            {state.deckSize > 1 && (
              <div className="absolute top-[1.5px] left-[1.5px]">
                <HwatuCard
                  card={{ id: "__pile2", month: 1, type: "junk", name: "", flower: "", faceUp: false } as any}
                  faceDown
                  size="lg"
                  disabled
                />
              </div>
            )}
            {state.deckSize > 0 ? (
              <div className="relative">
                <HwatuCard
                  card={{ id: "__pile1", month: 1, type: "junk", name: "", flower: "", faceUp: false } as any}
                  faceDown
                  size="lg"
                  disabled
                />
              </div>
            ) : (
              <div className="flex h-[108px] w-[72px] items-center justify-center rounded-lg border-2 border-dashed border-white/15 text-[10px] text-white/25">
                Empty
              </div>
            )}

            {/* Count badge */}
            {state.deckSize > 0 && (
              <div className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-jade text-[11px] font-bold text-white shadow-lg">
                {state.deckSize}
              </div>
            )}
          </div>
        </div>

        {/* ── Table Stacks ── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {state.tableStacks.map((stack) => {
            const isDropTarget = matchingMonths.includes(stack.month);
            return (
              <div
                key={`stack-${stack.month}`}
                data-drop-month={stack.month}
                className={`relative flex flex-col items-center rounded-lg transition-all ${isDropTarget ? "ring-2 ring-gold/70 bg-gold/10 scale-105" : ""
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

        {/* ── Turn state info — played / drawn cards ── */}
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
                  initial={{ opacity: 0, x: -80, y: 0, scale: 0.5, rotateY: 180 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: isDrawPhase ? 1.15 : 1,
                    rotateY: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 16,
                    mass: 0.8,
                  }}
                  className="text-center"
                >
                  <p className={`mb-1 text-[10px] font-medium ${isDrawPhase ? "text-gold animate-pulse" : "text-white/50"}`}>
                    {isDrawPhase ? "Stock Draw!" : "Drawn"}
                  </p>
                  <div className={`transition-all duration-300 ${isDrawPhase ? "ring-2 ring-gold/60 rounded-lg shadow-lg shadow-gold/20" : ""}`}>
                    <HwatuCard
                      card={state.turnState.stockCard}
                      disabled
                      size={isDrawPhase ? "lg" : "sm"}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

