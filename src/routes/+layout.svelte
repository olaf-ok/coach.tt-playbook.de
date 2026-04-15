<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { seedIfEmpty } from '$lib/db/seed';
	import { theme } from '$lib/theme/store.svelte';
	import { tvSession } from '$lib/tv/session.svelte';

	let { children } = $props();

	const hideChrome = $derived($page.url.pathname.startsWith('/tv'));
	const isTvView = $derived($page.url.pathname.startsWith('/tv'));

	onMount(async () => {
		theme.init();
		try {
			const seeded = await seedIfEmpty();
			if (seeded) await invalidateAll();
		} catch (err) {
			console.warn('seed failed', err);
		}
	});

	// Tablet-Seite: Theme an gepairten TV pushen.
	// Wichtig: theme.resolved ZUERST lesen, damit Svelte es als Dependency trackt
	// — ein frühes return vor dem Lesen würde die Reaktivität verlieren.
	$effect(() => {
		const resolvedTheme = theme.resolved;
		const client = tvSession.client;
		const clientStatus = client?.status;
		if (typeof window !== 'undefined') {
			(window as unknown as { __themeEffect?: unknown }).__themeEffect = {
				resolved: resolvedTheme,
				hasClient: !!client,
				status: clientStatus,
				isTvView,
				at: Date.now(),
			};
		}
		if (isTvView) return;
		if (!client || clientStatus !== 'paired') return;
		client.sendTheme(resolvedTheme);
	});

	// TV-Seite: empfangenes Theme anwenden
	$effect(() => {
		const client = tvSession.client;
		const received = client?.lastTheme;
		if (!isTvView) return;
		if (!received) return;
		theme.set(received);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-root">
	{#if !hideChrome}<Sidebar />{/if}
	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.app-root {
		height: 100dvh;
		display: flex;
		overflow: hidden;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
</style>
