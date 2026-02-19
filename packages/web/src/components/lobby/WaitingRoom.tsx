"use client";

import type { RoomInfo } from "@go-stop/shared";
import { useGameStore } from "@/stores/game-store";
import { useRouter } from "next/navigation";

interface WaitingRoomProps {
  room: RoomInfo;
}

export function WaitingRoom({ room }: WaitingRoomProps) {
  const router = useRouter();
  const { addBot, startGame, leaveRoom, socket } = useGameStore();
  const myId = socket?.id ?? "";
  const isHost = room.players[0]?.id === room.hostId;

  async function handleAddBot() {
    await addBot();
  }

  async function handleStart() {
    const success = await startGame();
    if (!success) {
      console.error("Failed to start game");
    }
  }

  function handleLeave() {
    leaveRoom();
    router.push("/");
  }

  const canStart = room.players.length >= 2;
  const canAddBot = room.players.length < room.maxPlayers;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Room header */}
        <div className="mb-8 text-center">
          <h1 className="font-display mb-2 text-3xl font-bold text-ink">
            Waiting Room
          </h1>
          <div className="inline-block rounded-full bg-gold/15 px-4 py-1.5">
            <span className="text-sm text-ink-light">Room Code: </span>
            <span className="font-mono text-lg font-bold text-gold-dark">
              {room.id}
            </span>
          </div>
        </div>

        {/* Player list */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-light">
            Players ({room.players.length}/{room.maxPlayers})
          </h2>

          <div className="space-y-2">
            {room.players.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-lg bg-cream/50 px-4 py-3"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white
                    ${i === 0 ? "bg-gold" : i === 1 ? "bg-crimson" : i === 2 ? "bg-royal-blue" : "bg-jade"}`}
                >
                  {player.isBot ? "🤖" : player.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink">
                    {player.name}
                    {player.id === room.hostId && (
                      <span className="ml-2 text-xs text-gold-dark">HOST</span>
                    )}
                  </p>
                  {player.isBot && (
                    <p className="text-xs text-ink-light">Computer</p>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    ?
                  </div>
                  <p className="text-sm text-ink-light/50">Waiting for player...</p>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canAddBot && (
            <button
              onClick={handleAddBot}
              className="w-full rounded-lg border-2 border-gold/30 bg-white py-3 font-medium
                       text-gold-dark transition-all hover:bg-gold/5"
            >
              + Add Bot
            </button>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full rounded-lg bg-crimson py-3.5 text-lg font-semibold text-white
                     shadow-md transition-all hover:bg-crimson-dark
                     disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Game
          </button>

          <button
            onClick={handleLeave}
            className="w-full rounded-lg py-2 text-sm text-ink-light transition-all hover:text-crimson"
          >
            Leave Room
          </button>
        </div>
      </div>
    </main>
  );
}
