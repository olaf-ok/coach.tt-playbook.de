<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileTabBar from '$lib/components/MobileTabBar.svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import Splash from '$lib/splash/Splash.svelte';
	import { shouldShowSplash, SPLASH_SESSION_KEY } from '$lib/splash/splash-state';
	import { theme } from '$lib/theme/store.svelte';
	import { tvSession } from '$lib/tv/session.svelte';
	import { auth } from '$lib/auth/client.svelte';
	import { billing } from '$lib/billing/client.svelte';

	let { children } = $props();

	const hideChrome = $derived($page.url.pathname.startsWith('/tv'));
	const isTvView = $derived($page.url.pathname.startsWith('/tv'));

	let showSplash = $state(false);

	onMount(async () => {
		theme.init();
		await auth.init();
		billing.init();

		if (shouldShowSplash(sessionStorage, $page.url.pathname)) {
			sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
			showSplash = true;
		}
	});

	// Tablet-Seite: Theme an gepairten TV pushen.
	// Wichtig: theme.resolved ZUERST lesen, damit Svelte es als Dependency trackt
	// — ein frühes return vor dem Lesen würde die Reaktivität verlieren.
	$effect(() => {
		const resolvedTheme = theme.resolved;
		const client = tvSession.client;
		const clientStatus = client?.status;
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

{#if showSplash}
	<Splash ondone={() => (showSplash = false)} />
{/if}

<div class="app-root">
	{#if !hideChrome}<Sidebar />{/if}
	<div class="main-col">
		{#if !hideChrome}<MobileHeader />{/if}
		<main class="content">
			{@render children()}
		</main>
		{#if !hideChrome}<MobileTabBar />{/if}
	</div>
</div>

<style>
	.app-root {
		height: 100dvh;
		display: flex;
		overflow: hidden;
	}

	.main-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	@media (max-width: 767.98px) {
		.content {
			padding-bottom: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
		}
	}
</style>
