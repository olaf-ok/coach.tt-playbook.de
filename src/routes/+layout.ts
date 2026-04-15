// SPA-Mode: die App lebt komplett client-seitig (IndexedDB, Canvas, WebSocket).
// SvelteKit liefert nur die Shell, alles andere wird im Browser gerendert.
export const ssr = false;
export const prerender = false;
