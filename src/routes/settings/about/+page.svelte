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
  </dl>

  <div class="imprint">
    <h3>{m.settings_about_imprint()}</h3>
    <address>
      <strong>OK-MARKED LLC</strong><br />
      30 N Gould St Ste R<br />
      Sheridan, WY 82801<br />
      USA
    </address>
    <dl class="contact">
      <dt>{m.settings_about_imprint_represented()}</dt>
      <dd>Olaf Kranz</dd>

      <dt>{m.settings_about_imprint_phone()}</dt>
      <dd><a href="tel:+50686921701">+506 86 92 17 01</a></dd>

      <dt>{m.settings_about_imprint_email()}</dt>
      <dd><a href="mailto:info@ok-marked.com">info@ok-marked.com</a></dd>

      <dt>{m.settings_about_imprint_web()}</dt>
      <dd><a href="https://ok-marked.com" target="_blank" rel="noopener">ok-marked.com</a></dd>
    </dl>
  </div>

  <nav class="legal-nav" aria-label="Legal">
    <a href="/legal/terms">{m.legal_terms_link()}</a>
    <a href="/legal/privacy">{m.legal_privacy_link()}</a>
  </nav>
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
  .imprint {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .imprint h3 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  address {
    font-style: normal;
    color: var(--color-text-primary);
    font-size: 15px;
    line-height: 1.6;
  }
  .contact {
    display: grid;
    grid-template-columns: 140px 1fr;
    row-gap: 6px;
    column-gap: 16px;
    margin: 0;
    border-top: 1px solid var(--color-border);
    padding-top: 14px;
  }
  .contact dt {
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  .contact dd {
    color: var(--color-text-primary);
    font-size: 14px;
  }
  a {
    color: var(--color-accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .legal-nav {
    display: flex;
    gap: 20px;
    font-size: 13px;
  }
  .legal-nav a {
    color: var(--color-text-secondary);
    text-decoration: underline;
  }
  .legal-nav a:hover {
    color: var(--color-text-primary);
  }
</style>
