import { createTvClient } from './client.svelte';

type TvClient = ReturnType<typeof createTvClient>;

let client = $state<TvClient | null>(null);

export const tvSession = {
  ensureClient(): TvClient {
    if (!client) client = createTvClient();
    return client;
  },
  hasClient(): boolean {
    return client !== null;
  },
  reset() {
    client?.disconnect();
    client = null;
  },
  get client(): TvClient | null {
    return client;
  },
  get status() {
    return client?.status ?? 'idle';
  },
};
