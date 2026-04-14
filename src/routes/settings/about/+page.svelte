<section class="about">
  <h2>Über</h2>

  <dl class="info">
    <dt>App</dt>
    <dd>TT Playbook Trainer</dd>

    <dt>Version</dt>
    <dd>0.0.1 (MVP)</dd>

    <dt>TV-Endpunkt</dt>
    <dd><a href="/tv" target="_blank" rel="noopener">/tv</a></dd>

    <dt>Built with</dt>
    <dd>SvelteKit · Konva · Dexie · WebSockets</dd>
  </dl>

  <p class="hint">
    Digitales Taktikboard für Tischtennistrainer. Zeichne auf dem Tablet, zeige auf dem TV.
  </p>
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
  .hint {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
  a {
    color: var(--color-accent);
  }
</style>
