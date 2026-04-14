import { describe, it, expect, beforeEach } from 'vitest';
import { RoomRegistry } from './rooms';
import type { PeerHandle, ServerMessage } from './types';

function mockPeer(): PeerHandle & { messages: ServerMessage[]; closed: boolean } {
  const state = {
    messages: [] as ServerMessage[],
    closed: false,
    send(m: ServerMessage) {
      state.messages.push(m);
    },
    close() {
      state.closed = true;
    },
  };
  return state;
}

describe('RoomRegistry', () => {
  let reg: RoomRegistry;
  beforeEach(() => {
    reg = new RoomRegistry({ codeLength: 4 });
  });

  it('registriert TV und vergibt einen Code', () => {
    const tv = mockPeer();
    const code = reg.registerTv(tv);
    expect(code).toMatch(/^\d{4}$/);
    expect(tv.messages).toEqual([{ type: 'registered', code }]);
  });

  it('vergibt eindeutige Codes', () => {
    const a = reg.registerTv(mockPeer());
    const b = reg.registerTv(mockPeer());
    expect(a).not.toBe(b);
  });

  it('pairt Tablet mit TV bei richtigem Code', () => {
    const tv = mockPeer();
    const tablet = mockPeer();
    const code = reg.registerTv(tv);

    const ok = reg.pair(tablet, code);
    expect(ok).toBe(true);
    expect(tv.messages.at(-1)).toEqual({ type: 'paired' });
    expect(tablet.messages).toEqual([{ type: 'paired' }]);
  });

  it('lehnt falschen Code ab', () => {
    const tablet = mockPeer();
    const ok = reg.pair(tablet, '9999');
    expect(ok).toBe(false);
    expect(tablet.messages).toEqual([{ type: 'error', reason: 'unknown-code' }]);
  });

  it('lehnt zweites Tablet ab', () => {
    const tv = mockPeer();
    const a = mockPeer();
    const b = mockPeer();
    const code = reg.registerTv(tv);

    reg.pair(a, code);
    const ok = reg.pair(b, code);
    expect(ok).toBe(false);
    expect(b.messages.at(-1)).toEqual({ type: 'error', reason: 'already-paired' });
  });

  it('leitet sync-Nachricht vom Tablet an TV weiter', () => {
    const tv = mockPeer();
    const tablet = mockPeer();
    const code = reg.registerTv(tv);
    reg.pair(tablet, code);

    const exercise = {
      id: 'x',
      name: 'Test',
      tags: [],
      strokes: [],
      repetitions: null,
      duration: null,
      createdAt: 0,
      updatedAt: 0,
    };
    reg.forwardSync(tablet, exercise);
    expect(tv.messages.at(-1)).toEqual({ type: 'sync', exercise });
  });

  it('leitet sync-Nachricht vom TV an Tablet weiter', () => {
    const tv = mockPeer();
    const tablet = mockPeer();
    const code = reg.registerTv(tv);
    reg.pair(tablet, code);

    const exercise = {
      id: 'x',
      name: 'Test',
      tags: [],
      strokes: [],
      repetitions: null,
      duration: null,
      createdAt: 0,
      updatedAt: 0,
    };
    reg.forwardSync(tv, exercise);
    expect(tablet.messages.at(-1)).toEqual({ type: 'sync', exercise });
  });

  it('informiert Peer bei Disconnect', () => {
    const tv = mockPeer();
    const tablet = mockPeer();
    const code = reg.registerTv(tv);
    reg.pair(tablet, code);

    reg.handleDisconnect(tablet);
    expect(tv.messages.at(-1)).toEqual({ type: 'peer-disconnected' });
  });

  it('räumt Raum auf wenn TV disconnected', () => {
    const tv = mockPeer();
    const tablet = mockPeer();
    const code = reg.registerTv(tv);
    reg.pair(tablet, code);

    reg.handleDisconnect(tv);
    expect(tablet.messages.at(-1)).toEqual({ type: 'peer-disconnected' });
    // Code ist wieder frei
    const tv2 = mockPeer();
    const code2 = reg.registerTv(tv2);
    expect(code2).toBeTruthy();
    // Pair-Versuch mit altem Code schlägt fehl
    const late = mockPeer();
    expect(reg.pair(late, code)).toBe(false);
  });
});
