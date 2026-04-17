import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
		}),
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			manifest: false,
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webmanifest}'],
				navigateFallback: '/'
			},
			devOptions: {
				enabled: false
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		setupFiles: ['src/test-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}', 'server/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
	}
});
