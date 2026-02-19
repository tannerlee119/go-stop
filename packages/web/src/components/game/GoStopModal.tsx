"use client";

import type { ClientGameState } from "@go-stop/shared";
import { useGameStore } from "@/stores/game-store";
import { motion } from "framer-motion";

interface GoStopModalProps {
  state: ClientGameState;
}

export function GoStopModal({ state }: GoStopModalProps) {
  const { sendAction } = useGameStore();
  const myPlayer = state.players.find((p) => p.id === state.myId);
  if (!myPlayer) return null;

  const goCount = myPlayer.goCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
      >
        <h2 className="font-display mb-2 text-3xl font-bold text-ink">
          Your Score: {myPlayer.score}
        </h2>
        <p className="mb-6 text-ink-light">
          {goCount === 0
            ? "You've reached the target! Go for more or stop to claim your points?"
            : `You've said Go ${goCount} time${goCount > 1 ? "s" : ""}. Risk more or claim now?`}
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => sendAction({ type: "go" })}
            className="flex-1 rounded-xl bg-gold py-4 text-xl font-bold text-white shadow-md
                     transition-all hover:bg-gold-dark hover:shadow-lg active:scale-95"
          >
            GO
            <span className="mt-0.5 block text-xs font-normal opacity-80">
              Risk it all
            </span>
          </button>
          <button
            onClick={() => sendAction({ type: "stop" })}
            className="flex-1 rounded-xl bg-crimson py-4 text-xl font-bold text-white shadow-md
                     transition-all hover:bg-crimson-dark hover:shadow-lg active:scale-95"
          >
            STOP
            <span className="mt-0.5 block text-xs font-normal opacity-80">
              Claim {myPlayer.score} pts
            </span>
          </button>
        </div>

        {goCount > 0 && (
          <p className="mt-4 text-xs text-ink-light">
            Go bonus: +{Math.min(goCount, 2)} chips
            {goCount >= 2 && " + double payment"}
          </p>
        )}
      </motion.div>
    </div>
  );
}
