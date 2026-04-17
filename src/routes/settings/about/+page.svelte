<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import AppLogo from '$lib/brand/AppLogo.svelte';
</script>

<section class="about">
  <h2>{m.settings_about_title()}</h2>

  <div class="logo">
    <AppLogo size={140} />
  </div>

  <dl class="info">
    <dt>{m.settings_about_app()}</dt>
    <dd>{m.common_brand_full()}</dd>

    <dt>{m.settings_about_version()}</dt>
    <dd>{m.settings_about_version_value()}</dd>

    <dt>{m.settings_about_imprint()}</dt>
    <dd>TT Playbook · OK MARKED LLC</dd>
  </dl>
</section>

<style>
  .about {
    padding: 40px;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .logo {
    color: var(--color-text-primary);
    padding: 8px 0;
  }
  .info {
    display: grid;
    grid-template-columns: 180px 1fr;
    row-gap: 10px;
    column-gap: 16px;
    margin: 0;
  }
  dt {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  dd {
    color: var(--color-text-primary);
    font-size: 14px;
    margin: 0;
  }
</style>
