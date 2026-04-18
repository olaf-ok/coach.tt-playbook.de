<script lang="ts">
  import AppLogo from '$lib/brand/AppLogo.svelte';

  let { children } = $props();
</script>

<div class="legal-shell">
  <header>
    <a href="/" class="brand" aria-label="TT Playbook Trainer">
      <AppLogo size={40} />
    </a>
  </header>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .legal-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
  }
  .brand {
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }
  main {
    flex: 1;
    padding: 40px 32px 80px;
    display: flex;
    justify-content: center;
  }
  @media (max-width: 767.98px) {
    header {
      padding: 16px 20px;
    }
    main {
      padding: 24px 20px 60px;
    }
  }
</style>
