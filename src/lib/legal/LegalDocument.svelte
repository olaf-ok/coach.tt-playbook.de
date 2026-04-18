<script lang="ts">
  import type { LegalDocument } from './types';

  let { doc }: { doc: LegalDocument } = $props();
</script>

<article class="legal-doc">
  <h1>{doc.title}</h1>
  <p class="last-updated">{doc.lastUpdated}</p>

  {#each doc.sections as section}
    <section>
      <h2>{section.heading}</h2>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="body">{@html section.html}</div>
    </section>
  {/each}
</article>

<style>
  .legal-doc {
    max-width: 760px;
    width: 100%;
    line-height: 1.6;
    font-size: 15px;
  }
  h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 6px;
  }
  .last-updated {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0 0 32px;
  }
  section {
    margin-bottom: 28px;
  }
  h2 {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .body :global(p) {
    margin: 0 0 10px;
  }
  .body :global(ul) {
    margin: 0 0 10px;
    padding-left: 22px;
  }
  .body :global(li) {
    margin-bottom: 4px;
  }
  .body :global(a) {
    color: var(--color-accent);
    text-decoration: underline;
  }
  .body :global(code) {
    background: var(--bg-surface);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 13px;
  }
</style>
