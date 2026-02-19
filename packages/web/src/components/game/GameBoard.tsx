"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  showResultsBanner?: boolean;
  onResultsBannerClick?: () => void;
}

export function GameBoard({ state, showResultsBanner, onResultsBannerClick }: GameBoardProps) {
  const { lastGoDeclaration, specialEvents, sendAction } = useGameStore();
  const myPlayer = state.players.find((p) => p.id === state.myId);
  const opponents = state.players.filter((p) => p.id !== state.myId);
  const isMyTurn =
    state.players[state.currentPlayerIndex]?.id === state.myId;
  const showGoStop = state.phase === "go-stop-decision" && isMyTurn;

  const [draggingCard, setDraggingCard] = useState<{ cardId: string; month: Month } | null>(null);
  const draggingCardRef = useRef<{ cardId: string; month: Month } | null>(null);
  const [goStopCollapsed, setGoStopCollapsed] = useState(false);

  // Reset collapsed state whenever the go-stop decision phase ends
  useEffect(() => {
    if (!showGoStop) setGoStopCollapsed(false);
  }, [showGoStop]);

  const handleDragStart = useCallback((cardId: string, month: Month) => {
    const card = { cardId, month };
    draggingCardRef.current = card;
    setDraggingCard(card);
  }, []);

  const handleDragEnd = useCallback((pointerX: number, pointerY: number) => {
    const card = draggingCardRef.current;
    draggingCardRef.current = null;
    setDraggingCard(null);

    if (!card) return;

    // Temporarily hide hand cards from hit-testing so they don't block drop targets
    const handContainer = document.querySelector("[data-player-hand]");
    const handEls: HTMLElement[] = [];
    if (handContainer) {
      handContainer.querySelectorAll<HTMLElement>("button, [style]").forEach((el) => {
        handEls.push(el);
        el.style.pointerEvents = "none";
      });
    }

    const elements = document.elementsFromPoint(pointerX, pointerY);

    // Restore pointer-events immediately
    handEls.forEach((el) => {
      el.style.pointerEvents = "";
    });

    const stackTarget = elements.find((el) => el.hasAttribute("data-drop-month"));
    const emptyTarget = elements.find((el) => el.hasAttribute("data-drop-empty"));
    const boardTarget = elements.find((el) => el.hasAttribute("data-drop-board"));

    if (stackTarget) {
      const month = Number(stackTarget.getAttribute("data-drop-month")) as Month;
      const matchingStacks = state.tableStacks.filter((s) => s.month === month);
      if (matchingStacks.length === 1 && matchingStacks[0].cards.length > 0) {
        sendAction({
          type: "play-card",
          cardId: card.cardId,
          targetCardId: matchingStacks[0].cards[0].id,
        });
      } else {
        sendAction({ type: "play-card", cardId: card.cardId });
      }
    } else if (emptyTarget || boardTarget) {
      // Drop on empty target or anywhere on the board area
      sendAction({ type: "play-card", cardId: card.cardId });
    }
    // If dropped outside the board entirely (e.g. on hand area), card snaps back
  }, [state.tableStacks, sendAction]);

  // Determine if the turn indicator should be clickable
  const turnIndicatorClick = goStopCollapsed
    ? () => setGoStopCollapsed(false)
    : showResultsBanner
      ? onResultsBannerClick
      : undefined;

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
        </div>
      </div>

      {/* Middle area: table */}
      <div
        data-drop-board
        className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-3"
      >
        <TurnIndicator
          state={state}
          isMyTurn={isMyTurn}
          onClick={turnIndicatorClick}
          labelOverride={showResultsBanner ? "Game Over — View Results" : undefined}
        />

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

      {showGoStop && !goStopCollapsed && (
        <GoStopModal state={state} onCollapse={() => setGoStopCollapsed(true)} />
      )}
    </div>
  );
}

