import type { Exercise } from '$lib/types/exercise';
import type { PeerHandle } from './types';

interface Room {
  code: string;
  tv: PeerHandle;
  tablet: PeerHandle | null;
}

export interface RoomRegistryOptions {
  codeLength?: number;
  rng?: () => number;
}

export class RoomRegistry {
  private rooms = new Map<string, Room>();
  private peerToRoom = new Map<PeerHandle, Room>();
  private codeLength: number;
  private rng: () => number;

  constructor(opts: RoomRegistryOptions = {}) {
    this.codeLength = opts.codeLength ?? 4;
    this.rng = opts.rng ?? Math.random;
  }

  registerTv(peer: PeerHandle): string {
    const code = this.generateUniqueCode();
    const room: Room = { code, tv: peer, tablet: null };
    this.rooms.set(code, room);
    this.peerToRoom.set(peer, room);
    peer.send({ type: 'registered', code });
    return code;
  }

  pair(peer: PeerHandle, code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) {
      peer.send({ type: 'error', reason: 'unknown-code' });
      return false;
    }
    if (room.tablet) {
      peer.send({ type: 'error', reason: 'already-paired' });
      return false;
    }
    room.tablet = peer;
    this.peerToRoom.set(peer, room);
    peer.send({ type: 'paired' });
    room.tv.send({ type: 'paired' });
    return true;
  }

  forwardSync(from: PeerHandle, exercise: Exercise): void {
    const room = this.peerToRoom.get(from);
    if (!room) return;
    const target = from === room.tv ? room.tablet : room.tv;
    if (!target) return;
    target.send({ type: 'sync', exercise });
  }

  handleDisconnect(peer: PeerHandle): void {
    const room = this.peerToRoom.get(peer);
    if (!room) return;
    this.peerToRoom.delete(peer);

    if (peer === room.tv) {
      room.tablet?.send({ type: 'peer-disconnected' });
      if (room.tablet) this.peerToRoom.delete(room.tablet);
      this.rooms.delete(room.code);
    } else {
      room.tv.send({ type: 'peer-disconnected' });
      room.tablet = null;
    }
  }

  private generateUniqueCode(): string {
    const max = Math.pow(10, this.codeLength);
    for (let attempt = 0; attempt < 1000; attempt++) {
      const n = Math.floor(this.rng() * max);
      const code = String(n).padStart(this.codeLength, '0');
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('could not generate unique code');
  }
}
