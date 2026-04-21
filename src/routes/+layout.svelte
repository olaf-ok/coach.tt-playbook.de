<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileTabBar from '$lib/components/MobileTabBar.svelte';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import MobileHint from '$lib/components/MobileHint.svelte';
	import PullToRefresh from '$lib/components/PullToRefresh.svelte';
	import Splash from '$lib/splash/Splash.svelte';
	import { shouldShowSplash, SPLASH_SESSION_KEY } from '$lib/splash/splash-state';
	import { theme } from '$lib/theme/store.svelte';
	import { tvSession } from '$lib/tv/session.svelte';
	import { auth } from '$lib/auth/client.svelte';
	import { billing } from '$lib/billing/client.svelte';
	import { installDbHooks } from '$lib/sync/dbhooks';
	import { installSyncTriggers } from '$lib/sync/triggers.svelte';
	import { syncClient } from '$lib/sync/client.svelte';
	import {
		collectLocalCount,
		decideInitialAction,
		pushAllLocalAsNew,
		discardLocalAndPull
	} from '$lib/sync/initial-sync';
	import { db } from '$lib/db/database';
	import InitialSyncMergeDialog from '$lib/components/InitialSyncMergeDialog.svelte';

	let { children } = $props();

	const hideChrome = $derived(
		$page.url.pathname.startsWith('/tv') || $page.url.pathname.startsWith('/legal')
	);
	const isTvView = $derived($page.url.pathname.startsWith('/tv'));

	let showSplash = $state(false);
	let showMergeDialog = $state<{ local: number; server: number } | null>(null);
	let syncInitializedFor: string | null = null;

	async function initializeSyncForUser(userId: string) {
		// Sync-Trigger registrieren (focus, online, visibility).
		installSyncTriggers();

		// Lokale Datenmenge VOR dem ersten Pull messen, damit der Delta
		// später korrekt berechnet werden kann.
		const localCount = await collectLocalCount();

		// syncClient.init setzt currentUserId und führt einen initialen Pull durch.
		await syncClient.init(userId);

		// Delta = Datensätze die der Pull hinzugefügt hat (vereinfachte Heuristik,
		// bei gleichen IDs kann es zu Unterabschätzung kommen – ist laut Plan akzeptiert).
		const postPullCount = (await db.exercises.count()) + (await db.playlists.count());
		const serverCount = Math.max(0, postPullCount - localCount);

		const action = decideInitialAction(localCount, serverCount);

		if (action.kind === 'pushOnly') {
			await pushAllLocalAsNew();
		} else if (action.kind === 'needsMergeChoice') {
			showMergeDialog = { local: localCount, server: serverCount };
		}
		// action.kind === 'noop': nichts zu tun
	}

	onMount(() => {
		// DB-Hooks müssen VOR dem ersten Dexie-Zugriff registriert sein.
		installDbHooks();

		void (async () => {
			theme.init();
			await auth.init();
			billing.init();

			if (shouldShowSplash(sessionStorage, $page.url.pathname)) {
				sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
				showSplash = true;
			}
		})();

		// Re-invalidate SvelteKit-loaded data whenever a server pull writes fresh
		// rows into IndexedDB (archive/playlists/draw pages load once via +page.ts
		// and are not live-reactive to Dexie without this nudge).
		const onPulled = () => {
			void invalidateAll();
		};
		window.addEventListener('tt-sync-pulled', onPulled);
		return () => window.removeEventListener('tt-sync-pulled', onPulled);
	});

	// Reactive sync-init: fires on first mount once auth resolves, and again
	// whenever the signed-in user changes mid-session (e.g. after verify-email
	// auto-login, which doesn't remount the layout).
	$effect(() => {
		const userId = auth.user?.id ?? null;
		if (!userId) return;
		if (syncInitializedFor === userId) return;
		syncInitializedFor = userId;
		void initializeSyncForUser(userId);
	});

	async function handleMerge(choice: 'keepBoth' | 'serverOnly' | 'localOnly') {
		showMergeDialog = null;
		if (choice === 'keepBoth') {
			await pushAllLocalAsNew();
		} else if (choice === 'serverOnly') {
			await discardLocalAndPull();
		}
		// 'localOnly': Lokaldaten bleiben erhalten, kein expliziter Push.
		// Bestehende Zeilen werden erst synchronisiert, wenn der Benutzer
		// sie bearbeitet und die DB-Hooks einen Push auslösen.
	}

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

{#if !hideChrome}<MobileHint />{/if}
{#if !hideChrome}<PullToRefresh />{/if}

{#if showMergeDialog}
	<InitialSyncMergeDialog
		localCount={showMergeDialog.local}
		serverCount={showMergeDialog.server}
		onChoose={handleMerge}
	/>
{/if}

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
