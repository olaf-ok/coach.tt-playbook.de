/* eslint-disable @typescript-eslint/no-explicit-any */
// Production server: combines SvelteKit (adapter-node handler) with WebSocket pairing on /ws.
// Mittwald gives us ONE port (env PORT), so both must share the same HTTP server.

import { createServer, type IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomRegistry } from '../src/lib/tv/rooms';
import type { ClientMessage, PeerHandle, ServerMessage } from '../src/lib/tv/types';
import { getDatabase } from './auth/db';

// Trigger DB open + migrations at boot
try {
  getDatabase();
  console.log('[auth] database initialized');
} catch (err) {
  console.error('[auth] database init failed:', err);
  process.exit(1);
}

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
    const str = raw.toString();
    if (str === '') return; // keepalive ping
    let msg: ClientMessage;
    try {
      msg = JSON.parse(str);
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

const LEGACY_HOSTS = new Set(['trainer.tt-playbook.de']);
const CANONICAL_HOST = 'coach.tt-playbook.de';
const TV_HOST = 'tv.tt-playbook.de';

const server = createServer((req, res) => {
  const fwdHost = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0].trim().toLowerCase();
  const host = (fwdHost || req.headers.host)?.split(':')[0].toLowerCase();
  if (host && LEGACY_HOSTS.has(host)) {
    res.statusCode = 301;
    res.setHeader('Location', `https://${CANONICAL_HOST}${req.url ?? '/'}`);
    res.end();
    return;
  }
  // Short TV URL: tv.tt-playbook.de → /tv. Only rewrite the root path so /ws,
  // /api, asset paths etc. keep working when the TV browser is active.
  if (host === TV_HOST && (req.url === '/' || req.url === '')) {
    req.url = '/tv';
  }
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

// Self-restart trigger: poll mtime of the trigger file every 5s. When it changes from the
// mtime we observed at boot → exit(1) so the supervisor respawns with fresh imports.
// Use an absolute path so we don't depend on cwd, and don't modify the file on boot.
const RESTART_TRIGGER = resolve(process.cwd(), '.restart-trigger');
let initialMtime = 0;
try {
  if (existsSync(RESTART_TRIGGER)) {
    initialMtime = statSync(RESTART_TRIGGER).mtimeMs;
  }
} catch {
  /* ignore */
}
console.log(`[restart] watching ${RESTART_TRIGGER} (initial mtime=${initialMtime})`);
setInterval(() => {
  try {
    if (!existsSync(RESTART_TRIGGER)) return;
    const m = statSync(RESTART_TRIGGER).mtimeMs;
    if (m > initialMtime && initialMtime > 0) {
      console.log(`[restart] trigger mtime ${m} > ${initialMtime}, exiting`);
      process.exit(1);
    }
    // First observation when file appears post-boot — record baseline so we don't
    // trigger an immediate restart.
    if (initialMtime === 0 && m > 0) {
      initialMtime = m;
    }
  } catch {
    /* ignore */
  }
}, 5000).unref();
