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

  // ── Match detection for highlights ──
  // Hand card: find which stack it landed on (the engine places it there)
  const handCardId = state.turnState.handCard?.id;
  const handMatchMonth = handCardId
    ? state.tableStacks.find((s) => s.cards.some((c) => c.id === handCardId))?.month ?? null
    : null;

  // Triple-match (4-of-a-kind): hand card is not on any stack but captured cards exist
  const capturedThisTurn = state.turnState.capturedThisTurn;
  const isTripleCapture =
    handCardId != null && handMatchMonth === null && capturedThisTurn.length > 0;

  // Stock card: during draw phase, find which stack it will match
  const stockCard = state.turnState.stockCard;
  const stockTargetMonth =
    isDrawPhase && stockCard
      ? state.tableStacks.find((s) => s.month === stockCard.month)?.month ?? null
      : null;

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

      <div className="relative flex items-center justify-center gap-6">
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
            const isHandMatch = handMatchMonth === stack.month;
            const isStockTarget = stockTargetMonth === stack.month;

            // Build highlight classes
            let highlightClasses = "";
            if (isDropTarget) {
              highlightClasses = "ring-2 ring-gold/70 bg-gold/10 scale-105";
            } else if (isStockTarget) {
              highlightClasses = "ring-2 ring-sky-400/70 bg-sky-400/10 scale-[1.03]";
            } else if (isHandMatch) {
              highlightClasses = "ring-2 ring-gold/50 bg-gold/5";
            }

            return (
              <div
                key={`stack-${stack.month}`}
                data-drop-month={stack.month}
                className={`group relative flex flex-col items-center rounded-lg transition-all duration-300 ${highlightClasses}`}
              >
                <div className="relative">
                  {stack.cards.map((card, cardIdx) => {
                    const isChoice = state.captureChoices.some(
                      (c) => c.id === card.id,
                    );
                    const isTheHandCard = card.id === handCardId;
                    const overlapClass =
                      cardIdx > 0
                        ? "-mt-[72px] group-hover:-mt-[36px] transition-[margin] duration-200"
                        : "";
                    return (
                      <div
                        key={card.id}
                        className={overlapClass}
                        style={{ zIndex: cardIdx }}
                      >
                        {isTheHandCard ? (
                          <motion.div
                            initial={{ opacity: 0, y: -30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          >
                            <HwatuCard
                              card={card}
                              size="lg"
                              onClick={() => handleTableCardClick(card.id)}
                              disabled={!isChoice}
                              highlighted={isChoice}
                            />
                          </motion.div>
                        ) : (
                          <HwatuCard
                            card={card}
                            size="lg"
                            onClick={() => handleTableCardClick(card.id)}
                            disabled={!isChoice}
                            highlighted={isChoice}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Stock card preview on target stack */}
                  {isStockTarget && stockCard && (
                    <motion.div
                      initial={{ opacity: 0, y: -40, scale: 0.6, rotateY: 180 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 130, damping: 14, delay: 0.3 }}
                      className="-mt-[72px] group-hover:-mt-[36px] transition-[margin] duration-200 relative"
                      style={{ zIndex: stack.cards.length }}
                    >
                      <div className="rounded-md ring-2 ring-sky-400 shadow-lg shadow-sky-400/30">
                        <HwatuCard card={stockCard} size="lg" disabled />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Stack count badge */}
                {stack.cards.length > 1 && (
                  <div className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white shadow">
                    {stack.cards.length}
                  </div>
                )}

                {/* Match label */}
                {isHandMatch && !isStockTarget && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-bold text-gold"
                  >
                    Played
                  </motion.div>
                )}
                {isStockTarget && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-1 rounded-full bg-sky-400/20 px-2 py-0.5 text-[9px] font-bold text-sky-300"
                  >
                    Stock →
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Stock card placed on board when no match */}
          {isDrawPhase && stockCard && stockTargetMonth === null && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.6, rotateY: 180 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 130, damping: 14, delay: 0.3 }}
              className="relative flex flex-col items-center rounded-lg ring-2 ring-sky-400/50 bg-sky-400/5"
            >
              <div className="rounded-md ring-2 ring-sky-400 shadow-lg shadow-sky-400/30">
                <HwatuCard card={stockCard} size="lg" disabled />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-1 rounded-full bg-sky-400/20 px-2 py-0.5 text-[9px] font-bold text-sky-300"
              >
                No match
              </motion.div>
            </motion.div>
          )}

          {/* Triple-match capture visualization (4-of-a-kind) */}
          {isTripleCapture && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0.6, scale: 0.9 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative flex flex-col items-center rounded-lg ring-2 ring-emerald-400/70 bg-emerald-400/10 p-1"
            >
              <div className="flex gap-0.5">
                {capturedThisTurn.map((card) => (
                  <HwatuCard key={card.id} card={card} size="sm" disabled />
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300"
              >
                Captured!
              </motion.div>
            </motion.div>
          )}

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

        {/* ── Turn state info (side reference panel — absolute positioned) ── */}
        <AnimatePresence>
          {hasTurnInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 rounded-xl bg-black/30 backdrop-blur-sm px-3 py-2 z-10"
            >
              {state.turnState.handCard && (
                <div className="text-center">
                  <p className="mb-1 text-[10px] text-gold/70">Played</p>
                  <div className="rounded-md ring-1 ring-gold/40">
                    <HwatuCard card={state.turnState.handCard} disabled size="sm" />
                  </div>
                </div>
              )}
              {state.turnState.stockCard && (
                <motion.div
                  initial={{ opacity: 0, x: -40, scale: 0.5, rotateY: 180 }}
                  animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 16, mass: 0.8 }}
                  className="text-center"
                >
                  <p className={`mb-1 text-[10px] font-medium ${isDrawPhase ? "text-sky-300 animate-pulse" : "text-white/50"}`}>
                    {isDrawPhase ? "Stock Draw!" : "Drawn"}
                  </p>
                  <div className={`rounded-md transition-all duration-300 ${isDrawPhase ? "ring-1 ring-sky-400/60" : ""}`}>
                    <HwatuCard
                      card={state.turnState.stockCard}
                      disabled
                      size="sm"
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

