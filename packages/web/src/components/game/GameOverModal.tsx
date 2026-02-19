"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import type { ScoreBreakdown } from "@go-stop/shared";
import { motion } from "framer-motion";

interface GameOverData {
  winnerId: string | null;
  isNagari: boolean;
  scores: Record<string, ScoreBreakdown>;
  payments: Record<string, number>;
}

interface GameOverModalProps {
  data: GameOverData;
}

export function GameOverModal({ data }: GameOverModalProps) {
  const router = useRouter();
  const { clearGameOver, leaveRoom, gameState } = useGameStore();

  const players = gameState?.players ?? [];
  const myId = gameState?.myId;
  const isWinner = data.winnerId === myId;

  function handlePlayAgain() {
    clearGameOver();
  }

  function handleLeave() {
    clearGameOver();
    leaveRoom();
    router.push("/");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          {data.isNagari ? (
            <>
              <div className="mb-2 text-4xl">😐</div>
              <h2 className="font-display text-2xl font-bold text-ink">Nagari</h2>
              <p className="text-ink-light">No winner this round. Payment doubled next round!</p>
            </>
          ) : isWinner ? (
            <>
              <div className="mb-2 text-4xl">🎉</div>
              <h2 className="font-display text-2xl font-bold text-gold-dark">You Win!</h2>
            </>
          ) : (
            <>
              <div className="mb-2 text-4xl">😔</div>
              <h2 className="font-display text-2xl font-bold text-ink">
                {players.find((p) => p.id === data.winnerId)?.name ?? "Someone"} Wins
              </h2>
            </>
          )}
        </div>

        {/* Scores */}
        <div className="mb-6 space-y-3">
          {players.map((player) => {
            const score = data.scores[player.id];
            const payment = data.payments[player.id] ?? 0;
            const isMe = player.id === myId;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-lg px-4 py-3
                  ${isMe ? "bg-gold/10 ring-1 ring-gold/30" : "bg-gray-50"}`}
              >
                <div>
                  <p className="font-medium text-ink">
                    {player.name}
                    {isMe && <span className="ml-1 text-xs text-ink-light">(you)</span>}
                  </p>
                  {score && (
                    <div className="flex gap-2 text-xs text-ink-light">
                      {score.brightScore > 0 && <span>光{score.brightScore}</span>}
                      {score.animalScore > 0 && <span>열{score.animalScore}</span>}
                      {score.ribbonScore > 0 && <span>띠{score.ribbonScore}</span>}
                      {score.junkScore > 0 && <span>피{score.junkScore}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-ink">
                    {score?.total ?? 0} pts
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      payment > 0
                        ? "text-jade"
                        : payment < 0
                          ? "text-crimson"
                          : "text-ink-light"
                    }`}
                  >
                    {payment > 0 ? `+${payment}` : payment} chips
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 rounded-lg bg-jade py-3 font-semibold text-white
                     transition-all hover:bg-jade-dark"
          >
            Play Again
          </button>
          <button
            onClick={handleLeave}
            className="flex-1 rounded-lg border border-gray-200 py-3 font-medium text-ink-light
                     transition-all hover:bg-gray-50"
          >
            Leave
          </button>
        </div>
      </motion.div>
    </div>
  );
}
