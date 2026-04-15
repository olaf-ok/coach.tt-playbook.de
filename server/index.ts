import { WebSocketServer, WebSocket } from 'ws';
import { RoomRegistry } from '../src/lib/tv/rooms';
import type { ClientMessage, PeerHandle, ServerMessage } from '../src/lib/tv/types';

const PORT = Number(process.env.TV_WS_PORT ?? 5174);
const registry = new RoomRegistry();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  const peer: PeerHandle = {
    send(msg: ServerMessage) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    },
    close() {
      ws.close();
    },
  };

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      peer.send({ type: 'error', reason: 'invalid-json' });
      return;
    }
    switch (msg.type) {
      case 'register-tv':
        registry.registerTv(peer);
        break;
      case 'pair':
        registry.pair(peer, msg.code);
        break;
      case 'sync':
        registry.forwardSync(peer, msg.exercise);
        break;
      case 'theme':
        registry.forwardTheme(peer, msg.theme);
        break;
      default:
        peer.send({ type: 'error', reason: 'unknown-message' });
    }
  });

  ws.on('close', () => registry.handleDisconnect(peer));
});

console.log(`TV-Pairing WebSocket-Server läuft auf ws://localhost:${PORT}`);
