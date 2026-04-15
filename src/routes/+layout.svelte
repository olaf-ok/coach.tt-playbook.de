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

	// Tablet-Seite: Theme an gepairten TV pushen
	$effect(() => {
		if (isTvView) return;
		const client = tvSession.client;
		if (!client || client.status !== 'paired') return;
		client.sendTheme(theme.resolved);
	});

	// TV-Seite: empfangenes Theme anwenden
	$effect(() => {
		if (!isTvView) return;
		const client = tvSession.client;
		if (!client?.lastTheme) return;
		theme.set(client.lastTheme);
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
