<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
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
