import type { ClientMessage, ServerMessage } from './types';
import type { Exercise } from '$lib/types/exercise';

export type TvClientStatus = 'idle' | 'connecting' | 'registered' | 'paired' | 'error' | 'closed';

function defaultWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:5174';
  const envUrl = (import.meta as { env?: { VITE_TV_WS_URL?: string } }).env?.VITE_TV_WS_URL;
  if (envUrl) return envUrl;
  // Dev: standalone WS server auf 5174.
  // Prod: gleicher Host, Pfad /ws (wss bei HTTPS).
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `ws://${window.location.hostname}:5174`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

export function createTvClient() {
  let status = $state<TvClientStatus>('idle');
  let code = $state<string | null>(null);
  let errorReason = $state<string | null>(null);
  let lastExercise = $state<Exercise | null>(null);
  let lastTheme = $state<'light' | 'dark' | null>(null);
  let ws: WebSocket | null = null;

  let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  function connect(onOpen: () => void) {
    if (ws) return;
    status = 'connecting';
    ws = new WebSocket(defaultWsUrl());
    ws.onopen = () => {
      // Ping every 25s to keep ws alive through Ingress/proxy idle-timeouts.
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          try {
            ws.send('');
          } catch {
            /* ignore */
          }
        }
      }, 25000);
      onOpen();
    };
    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'registered':
          code = msg.code;
          status = 'registered';
          break;
        case 'paired':
          status = 'paired';
          break;
        case 'peer-disconnected':
          status = 'registered';
          lastExercise = null;
          break;
        case 'sync':
          lastExercise = msg.exercise;
          break;
        case 'theme':
          lastTheme = msg.theme;
          break;
        case 'error':
          errorReason = msg.reason;
          status = 'error';
          break;
      }
    };
    ws.onclose = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      status = 'closed';
      ws = null;
    };
    ws.onerror = () => {
      errorReason = 'connection-failed';
      status = 'error';
    };
  }

  function send(msg: ClientMessage) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  }

  function registerAsTv() {
    connect(() => send({ type: 'register-tv' }));
  }

  function pairAsTablet(inputCode: string) {
    connect(() => send({ type: 'pair', code: inputCode }));
  }

  function sendSync(exercise: Exercise) {
    send({ type: 'sync', exercise });
  }

  function sendTheme(theme: 'light' | 'dark') {
    send({ type: 'theme', theme });
  }

  function disconnect() {
    ws?.close();
    ws = null;
    status = 'closed';
    code = null;
    lastExercise = null;
  }

  return {
    get status() {
      return status;
    },
    get code() {
      return code;
    },
    get errorReason() {
      return errorReason;
    },
    get lastExercise() {
      return lastExercise;
    },
    get lastTheme() {
      return lastTheme;
    },
    registerAsTv,
    pairAsTablet,
    sendSync,
    sendTheme,
    disconnect,
  };
}
