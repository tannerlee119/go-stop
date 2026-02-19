"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ClientGameState, Month } from "@go-stop/shared";
import { PlayerHand } from "./PlayerHand";
import { TableLayout } from "./TableLayout";
import { OpponentBar } from "./OpponentBar";
import { CapturedCardsPanel } from "./CapturedCardsPanel";
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

    // Use bounding-rect hit testing — much more reliable than elementsFromPoint
    // Check each stack on the table
    let hitMonth: Month | null = null;
    const stackEls = document.querySelectorAll<HTMLElement>("[data-drop-month]");
    for (const el of stackEls) {
      const rect = el.getBoundingClientRect();
      if (
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
      ) {
        hitMonth = Number(el.getAttribute("data-drop-month")) as Month;
        break;
      }
    }

    // Check empty drop zone
    if (!hitMonth) {
      const emptyEl = document.querySelector<HTMLElement>("[data-drop-empty]");
      if (emptyEl) {
        const rect = emptyEl.getBoundingClientRect();
        if (
          pointerX >= rect.left &&
          pointerX <= rect.right &&
          pointerY >= rect.top &&
          pointerY <= rect.bottom
        ) {
          sendAction({ type: "play-card", cardId: card.cardId });
          return;
        }
      }
    }

    if (hitMonth) {
      const matchingStacks = state.tableStacks.filter((s) => s.month === hitMonth);
      if (matchingStacks.length === 1 && matchingStacks[0].cards.length > 0) {
        sendAction({
          type: "play-card",
          cardId: card.cardId,
          targetCardId: matchingStacks[0].cards[0].id,
        });
      } else {
        sendAction({ type: "play-card", cardId: card.cardId });
      }
      return;
    }

    // Fallback: dropped anywhere on the board area
    const boardEl = document.querySelector<HTMLElement>("[data-drop-board]");
    if (boardEl) {
      const rect = boardEl.getBoundingClientRect();
      if (
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
      ) {
        sendAction({ type: "play-card", cardId: card.cardId });
        return;
      }
    }
    // If dropped outside the board entirely, card snaps back
  }, [state.tableStacks, sendAction]);

  // Determine if the turn indicator should be clickable
  const turnIndicatorClick = goStopCollapsed
    ? () => setGoStopCollapsed(false)
    : showResultsBanner
      ? onResultsBannerClick
      : undefined;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-jade-dark">
      {/* Board area: captures left | table center | opponents right */}
      <div
        data-drop-board
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-3"
      >
        {/* Left sidebar: my captures */}
        {myPlayer && (
          <div className="absolute left-4 top-4 bottom-4 flex w-52 flex-col gap-1 overflow-y-auto rounded-xl bg-black/15 px-2 py-2">
            <span className="text-[9px] font-medium uppercase tracking-wide text-white/40">
              My Captures
            </span>
            <CapturedCardsPanel
              captured={myPlayer.captured}
              score={myPlayer.score}
              goCount={myPlayer.goCount}
              compact
            />
          </div>
        )}

        {/* Center: turn info + table stacks */}
        <div className="flex flex-col items-center justify-center gap-3">
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

        {/* Right sidebar: opponents */}
        {opponents.length > 0 && (
          <div className="absolute right-4 top-4 bottom-4 flex w-52 flex-col gap-2 overflow-y-auto rounded-xl bg-black/15 px-2 py-2">
            {opponents.map((opp, i) => (
              <OpponentBar
                key={opp.id}
                player={opp}
                isActive={state.players[state.currentPlayerIndex]?.id === opp.id}
                index={i}
              />
            ))}
          </div>
        )}
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

