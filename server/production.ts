/* eslint-disable @typescript-eslint/no-explicit-any */
// Production server: combines SvelteKit (adapter-node handler) with WebSocket pairing on /ws.
// Mittwald gives us ONE port (env PORT), so both must share the same HTTP server.

import { createServer, type IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { closeSync, openSync, statSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomRegistry } from '../src/lib/tv/rooms';
import type { ClientMessage, PeerHandle, ServerMessage } from '../src/lib/tv/types';

const PORT = Number(process.env.PORT ?? 3000);

// SvelteKit adapter-node exports a request handler from build/handler.js after `npm run build`.
// Import as any because the build output's types aren't available here.
// @ts-expect-error — path resolved at runtime after build
import { handler } from '../build/handler.js';

const registry = new RoomRegistry();
const wss = new WebSocketServer({ noServer: true });

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

const server = createServer((req, res) => {
  try {
    (handler as (req: IncomingMessage, res: typeof res) => void)(req, res);
  } catch (err) {
    console.error('[handler-sync]', req.url, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Server error');
    }
  }
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
  if (req.url === '/ws' || req.url?.startsWith('/ws?')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`TT Playbook Trainer läuft auf Port ${PORT} (HTTP + WS /ws)`);
});

// Self-restart trigger: poll mtime of the trigger file every 2s. When it changes from the
// mtime we observed at boot → exit(1) so the Mittwald supervisor respawns with fresh imports.
const RESTART_TRIGGER = '.restart-trigger';
try {
  closeSync(openSync(RESTART_TRIGGER, 'a'));
  const initialMtime = statSync(RESTART_TRIGGER).mtimeMs;
  setInterval(() => {
    try {
      const m = statSync(RESTART_TRIGGER).mtimeMs;
      if (m > initialMtime) {
        console.log('[restart] trigger mtime changed, exiting so supervisor restarts');
        process.exit(1);
      }
    } catch {
      // file missing briefly — ignore
    }
  }, 2000).unref();
} catch (err) {
  console.error('[restart] could not install poller', err);
}
