"use client";

import type { ClientGameState } from "@go-stop/shared";
import { HwatuCard } from "./HwatuCard";
import { useGameStore } from "@/stores/game-store";

interface TableLayoutProps {
  state: ClientGameState;
}

export function TableLayout({ state }: TableLayoutProps) {
  const { sendAction } = useGameStore();
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myId;
  const needsCaptureChoice =
    (state.phase === "choose-hand-capture" || state.phase === "choose-stock-capture") &&
    isMyTurn;

  function handleTableCardClick(cardId: string) {
    if (!needsCaptureChoice) return;
    sendAction({ type: "choose-capture", targetCardId: cardId });
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Capture choice hint */}
      {needsCaptureChoice && (
        <div className="mb-3 text-center">
          <span className="inline-block animate-pulse rounded-full bg-gold/20 px-4 py-1 text-sm font-medium text-gold">
            Choose a card to capture
          </span>
        </div>
      )}

      {/* Table stacks */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {state.tableStacks.map((stack) => (
          <div
            key={`stack-${stack.month}`}
            className="relative flex flex-col items-center"
          >
            {/* Stacked cards */}
            <div className="relative">
              {stack.cards.map((card, cardIdx) => {
                const isChoice = state.captureChoices.some(
                  (c) => c.id === card.id,
                );
                return (
                  <div
                    key={card.id}
                    className={cardIdx > 0 ? "-mt-14" : ""}
                    style={{ zIndex: cardIdx }}
                  >
                    <HwatuCard
                      card={card}
                      onClick={() => handleTableCardClick(card.id)}
                      disabled={!isChoice}
                      highlighted={isChoice}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stack count badge */}
            {stack.cards.length > 1 && (
              <div className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white shadow">
                {stack.cards.length}
              </div>
            )}
          </div>
        ))}

        {state.tableStacks.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-white/20 px-12 py-8 text-sm text-white/30">
            Table is empty
          </div>
        )}
      </div>

      {/* Turn state info */}
      {(state.turnState.handCard || state.turnState.stockCard) && (
        <div className="mt-4 flex items-center justify-center gap-6">
          {state.turnState.handCard && (
            <div className="text-center">
              <p className="mb-1 text-xs text-white/50">Played</p>
              <HwatuCard card={state.turnState.handCard} disabled small />
            </div>
          )}
          {state.turnState.stockCard && (
            <div className="text-center">
              <p className="mb-1 text-xs text-white/50">Drawn</p>
              <HwatuCard card={state.turnState.stockCard} disabled small />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
