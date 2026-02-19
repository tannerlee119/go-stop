import { nanoid } from "nanoid";
import type { GameConfig, RoomInfo } from "@go-stop/shared";
import { GameRoom } from "./game-room.js";

export class RoomManager {
  private rooms = new Map<string, GameRoom>();

  createRoom(
    hostId: string,
    hostName: string,
    maxPlayers: number,
    config?: Partial<GameConfig>,
  ): GameRoom {
    const id = nanoid(8);
    const room = new GameRoom(id, hostId, hostName, maxPlayers, config);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: string): GameRoom | undefined {
    return this.rooms.get(id);
  }

  removeRoom(id: string): void {
    this.rooms.delete(id);
  }

  listRooms(): RoomInfo[] {
    return Array.from(this.rooms.values())
      .filter((r) => r.status === "waiting")
      .map((r) => r.toRoomInfo());
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  cleanupEmptyRooms(): void {
    for (const [id, room] of this.rooms) {
      if (room.playerCount === 0) {
        this.rooms.delete(id);
      }
    }
  }
}
