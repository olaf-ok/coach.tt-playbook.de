import type { Exercise } from '../types/exercise';

export type ClientMessage =
  | { type: 'register-tv' }
  | { type: 'pair'; code: string }
  | { type: 'sync'; exercise: Exercise };

export type ServerMessage =
  | { type: 'registered'; code: string }
  | { type: 'paired' }
  | { type: 'peer-disconnected' }
  | { type: 'sync'; exercise: Exercise }
  | { type: 'error'; reason: string };

export interface PeerHandle {
  send(msg: ServerMessage): void;
  close(): void;
}
