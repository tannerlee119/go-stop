"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import type { RoomInfo } from "@go-stop/shared";

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") ?? "Player";

  const {
    connect,
    connected,
    createRoom,
    joinRoom,
    listRooms,
    addBot,
    startGame,
    room,
  } = useGameStore();

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    connect(playerName);
  }, [playerName, connect]);

  useEffect(() => {
    if (room) {
      router.push(`/room/${room.id}`);
    }
  }, [room, router]);

  useEffect(() => {
    if (!connected) return;
    refreshRooms();
    const interval = setInterval(refreshRooms, 5000);
    return () => clearInterval(interval);
  }, [connected]);

  async function refreshRooms() {
    const result = await listRooms();
    setRooms(result);
  }

  async function handleCreate() {
    setLoading(true);
    const isSolo = maxPlayers === 1;
    const room = await createRoom(isSolo ? 2 : maxPlayers);
    if (room && isSolo) {
      await addBot();
      await startGame();
    }
    setLoading(false);
  }

  async function handleJoin(roomId: string) {
    setLoading(true);
    await joinRoom(roomId);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display mb-1 text-4xl font-bold text-ink">Lobby</h1>
          <p className="text-ink-light">
            Welcome, <span className="font-semibold">{playerName}</span>
            {connected ? (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-jade" />
            ) : (
              <span className="ml-2 text-sm text-crimson">Connecting...</span>
            )}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Create Room */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="font-display mb-4 text-xl font-semibold text-ink">
              Create Room
            </h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-ink-light">
                Max Players
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxPlayers(n)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all
                      ${maxPlayers === n
                        ? "border-gold bg-gold/10 text-gold-dark"
                        : "border-gray-200 text-ink-light hover:border-gold/50"
                      }`}
                  >
                    {n === 1 ? "Solo" : `${n}P`}
                  </button>
                ))}
              </div>
              {maxPlayers === 1 && (
                <p className="mt-2 text-xs text-ink-light">Play against a bot</p>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={!connected || loading}
              className="w-full rounded-lg bg-jade py-3 font-semibold text-white
                       shadow-sm transition-all hover:bg-jade-dark
                       disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>

          {/* Join Room */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="font-display mb-4 text-xl font-semibold text-ink">
              Join Room
            </h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-ink-light">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center
                         text-lg tracking-widest
                         focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <button
              onClick={() => handleJoin(joinCode)}
              disabled={!connected || !joinCode.trim() || loading}
              className="w-full rounded-lg bg-royal-blue py-3 font-semibold text-white
                       shadow-sm transition-all hover:bg-royal-blue/90
                       disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>

        {/* Available Rooms */}
        {rooms.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display mb-4 text-xl font-semibold text-ink">
              Open Rooms
            </h2>
            <div className="space-y-3">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-sm text-ink-light">
                      {r.players.length}/{r.maxPlayers} players · Code:{" "}
                      <span className="font-mono font-medium">{r.id}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(r.id)}
                    disabled={loading}
                    className="rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium
                             text-gold-dark transition-all hover:bg-gold/30"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LobbyContent />
    </Suspense>
  );
}
