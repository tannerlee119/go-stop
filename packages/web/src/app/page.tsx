"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FLOWER_SYMBOLS = ["🌸", "🏔️", "🌙", "🍁", "🦌", "🦢", "🌺", "🎋"];

export default function HomePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");

  function handlePlay() {
    if (!playerName.trim()) return;
    const encoded = encodeURIComponent(playerName.trim());
    router.push(`/lobby?name=${encoded}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="animate-fade-in w-full max-w-lg text-center">
        {/* Decorative flowers */}
        <div className="mb-6 flex justify-center gap-3 text-2xl opacity-60">
          {FLOWER_SYMBOLS.map((f, i) => (
            <span
              key={i}
              className="inline-block"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-display mb-2 text-6xl font-bold tracking-tight text-ink">
          Go-Stop
        </h1>
        <p className="font-display mb-1 text-3xl text-gold-dark">고스톱</p>
        <p className="mb-10 text-ink-light">
          The classic Korean flower card game
        </p>

        {/* Name input */}
        <div className="mx-auto mb-6 max-w-xs">
          <label
            htmlFor="player-name"
            className="mb-2 block text-sm font-medium text-ink-light"
          >
            Your Name
          </label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full rounded-lg border border-gold/30 bg-white px-4 py-3 text-center text-lg
                     text-ink shadow-sm transition-all
                     placeholder:text-ink-light/40
                     focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={!playerName.trim()}
          className="rounded-lg bg-crimson px-10 py-3.5 text-lg font-semibold text-white
                   shadow-md transition-all
                   hover:bg-crimson-dark hover:shadow-lg
                   active:scale-[0.98]
                   disabled:cursor-not-allowed disabled:opacity-40"
        >
          Play
        </button>

        {/* Info cards */}
        <div className="mt-14 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-white/60 p-4 shadow-sm">
            <div className="mb-1 text-2xl">🎴</div>
            <div className="font-medium text-ink">1–4 Players</div>
            <div className="text-ink-light/70">Online multiplayer</div>
          </div>
          <div className="rounded-lg bg-white/60 p-4 shadow-sm">
            <div className="mb-1 text-2xl">🤖</div>
            <div className="font-medium text-ink">Solo Mode</div>
            <div className="text-ink-light/70">Play vs. bot</div>
          </div>
          <div className="rounded-lg bg-white/60 p-4 shadow-sm">
            <div className="mb-1 text-2xl">⚡</div>
            <div className="font-medium text-ink">Real-time</div>
            <div className="text-ink-light/70">Live gameplay</div>
          </div>
        </div>
      </div>
    </main>
  );
}
