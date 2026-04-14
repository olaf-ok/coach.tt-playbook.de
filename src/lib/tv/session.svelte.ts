import { createTvClient } from './client.svelte';

type TvClient = ReturnType<typeof createTvClient>;

let client: TvClient | null = null;

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
  get status() {
    return client?.status ?? 'idle';
  },
};
