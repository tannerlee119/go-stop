"use client";

import { useState, useCallback } from "react";
import type { ClientGameState, Month } from "@go-stop/shared";
import { PlayerHand } from "./PlayerHand";
import { TableLayout } from "./TableLayout";
import { OpponentBar } from "./OpponentBar";
import { ScorePanel } from "./ScorePanel";
import { GoStopModal } from "./GoStopModal";
import { TurnIndicator } from "./TurnIndicator";
import { useGameStore } from "@/stores/game-store";

interface GameBoardProps {
  state: ClientGameState;
}

export function GameBoard({ state }: GameBoardProps) {
  const { lastGoDeclaration, specialEvents, sendAction } = useGameStore();
  const myPlayer = state.players.find((p) => p.id === state.myId);
  const opponents = state.players.filter((p) => p.id !== state.myId);
  const isMyTurn =
    state.players[state.currentPlayerIndex]?.id === state.myId;
  const showGoStop = state.phase === "go-stop-decision" && isMyTurn;

  const [draggingCard, setDraggingCard] = useState<{ cardId: string; month: Month } | null>(null);

  const handleDragStart = useCallback((cardId: string, month: Month) => {
    setDraggingCard({ cardId, month });
  }, []);

  const handleDragEnd = useCallback((pointerX: number, pointerY: number) => {
    if (!draggingCard) {
      setDraggingCard(null);
      return;
    }

    const elements = document.elementsFromPoint(pointerX, pointerY);
    const stackTarget = elements.find((el) => el.hasAttribute("data-drop-month"));
    const emptyTarget = elements.find((el) => el.hasAttribute("data-drop-empty"));

    if (stackTarget) {
      const month = Number(stackTarget.getAttribute("data-drop-month")) as Month;
      const matchingStacks = state.tableStacks.filter((s) => s.month === month);
      if (matchingStacks.length === 1 && matchingStacks[0].cards.length > 0) {
        sendAction({
          type: "play-card",
          cardId: draggingCard.cardId,
          targetCardId: matchingStacks[0].cards[0].id,
        });
      } else {
        sendAction({ type: "play-card", cardId: draggingCard.cardId });
      }
    } else if (emptyTarget) {
      sendAction({ type: "play-card", cardId: draggingCard.cardId });
    }
    // If neither target hit, the card snaps back without playing

    setDraggingCard(null);
  }, [draggingCard, state.tableStacks, sendAction]);

  return (
    <div className="flex min-h-screen flex-col bg-jade-dark">
      {/* Opponents + deck */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          {opponents.map((opp, i) => (
            <OpponentBar
              key={opp.id}
              player={opp}
              isActive={state.players[state.currentPlayerIndex]?.id === opp.id}
              index={i}
            />
          ))}

          {/* Deck info */}
          <div className="flex flex-col items-center gap-1 self-center rounded-lg bg-white/5 px-4 py-3 text-white/60">
            <span className="text-[10px] uppercase tracking-wide">Stock</span>
            <span className="text-lg font-bold">{state.deckSize}</span>
          </div>
        </div>
      </div>

      {/* Middle area: table */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-3">
        <TurnIndicator state={state} isMyTurn={isMyTurn} />

        {lastGoDeclaration && (
          <div className="animate-slide-up rounded-full bg-gold px-6 py-2 text-sm font-bold text-white shadow-lg">
            {lastGoDeclaration.playerName} declared GO! (×{lastGoDeclaration.goCount})
          </div>
        )}

        {specialEvents.length > 0 && (
          <div className="flex gap-2">
            {specialEvents.slice(-3).map((evt, i) => (
              <div
                key={i}
                className="animate-slide-up rounded-full bg-crimson/90 px-4 py-1.5 text-xs font-bold text-white"
              >
                {evt.type.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <TableLayout
          state={state}
          draggingMonth={draggingCard?.month ?? null}
        />
      </div>

      {/* My captures panel */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/10 px-4 py-2">
        <div className="mx-auto max-w-6xl">
          {myPlayer && <ScorePanel player={myPlayer} />}
        </div>
      </div>

      {/* My hand */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/30">
        <PlayerHand
          state={state}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>

      {showGoStop && <GoStopModal state={state} />}
    </div>
  );
}
