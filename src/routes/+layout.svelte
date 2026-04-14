<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { seedIfEmpty } from '$lib/db/seed';

	let { children } = $props();

	onMount(async () => {
		try {
			const seeded = await seedIfEmpty();
			if (seeded) await invalidateAll();
		} catch (err) {
			console.warn('seed failed', err);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-root">
	<Sidebar />
	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.app-root {
		height: 100vh;
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
