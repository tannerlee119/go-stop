"use client";

import type { ClientGameState } from "@go-stop/shared";
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
  const { lastGoDeclaration, specialEvents } = useGameStore();
  const myPlayer = state.players.find((p) => p.id === state.myId);
  const opponents = state.players.filter((p) => p.id !== state.myId);
  const isMyTurn =
    state.players[state.currentPlayerIndex]?.id === state.myId;
  const showGoStop = state.phase === "go-stop-decision" && isMyTurn;

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

        <TableLayout state={state} />
      </div>

      {/* My captures panel */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/10 px-4 py-2">
        <div className="mx-auto max-w-6xl">
          {myPlayer && <ScorePanel player={myPlayer} />}
        </div>
      </div>

      {/* My hand */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/30">
        <PlayerHand state={state} />
      </div>

      {showGoStop && <GoStopModal state={state} />}
    </div>
  );
}
