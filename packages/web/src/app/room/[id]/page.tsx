"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { GameBoard } from "@/components/game/GameBoard";
import { GameOverModal } from "@/components/game/GameOverModal";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { room, gameState, gameOver, connected, joinRoom, playerName } =
    useGameStore();

  useEffect(() => {
    if (connected && !room) {
      joinRoom(roomId);
    }
  }, [connected, room, roomId, joinRoom]);

  useEffect(() => {
    if (!connected && !playerName) {
      router.push("/");
    }
  }, [connected, playerName, router]);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-4xl">🎴</div>
          <p className="text-ink-light">Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (room.status === "waiting") {
    return <WaitingRoom room={room} />;
  }

  return (
    <>
      {gameState && <GameBoard state={gameState} />}
      {gameOver && <GameOverModal data={gameOver} />}
    </>
  );
}
