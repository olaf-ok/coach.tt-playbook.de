<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { language, setLanguage, type LanguageMode } from '$lib/i18n/language-store.svelte';

  interface Option {
    value: LanguageMode;
    label: string;
    hint: string;
  }

  const options: Option[] = [
    { value: 'system', label: m.lang_option_system_label(), hint: m.lang_option_system_sub() },
    { value: 'de', label: m.lang_option_de_label(), hint: 'DE' },
    { value: 'en', label: m.lang_option_en_label(), hint: 'EN' },
    { value: 'es', label: m.lang_option_es_label(), hint: 'ES' }
  ];

  const activeLabel = $derived(
    options.find((o) => o.value === language.mode)?.label ?? ''
  );
</script>

<section class="language">
  <h2>{m.settings_language_title()}</h2>
  <p class="hint">{m.settings_language_hint()}</p>

  <div class="options">
    {#each options as opt (opt.value)}
      <button
        type="button"
        class="option"
        class:active={language.mode === opt.value}
        onclick={() => setLanguage(opt.value)}
      >
        <span class="text">
          <span class="label">{opt.label}</span>
          <span class="hint">{opt.hint}</span>
        </span>
        <span class="radio" class:checked={language.mode === opt.value} aria-hidden="true"></span>
      </button>
    {/each}
  </div>

  <p class="note">{m.settings_language_active({ label: activeLabel })}</p>
</section>

<style>
  .language {
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
  .hint {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
  .options {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    overflow: hidden;
  }
  .option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: transparent;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  .option:last-child { border-bottom: 0; }
  .option:hover { background: var(--color-chip-bg); }
  .option.active { background: var(--color-chip-bg); }
  .text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .label { color: var(--color-text-primary); font-size: 15px; font-weight: 500; }
  .hint { color: var(--color-text-secondary); font-size: 12px; }
  .radio {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid var(--color-border); position: relative; flex-shrink: 0;
  }
  .radio.checked { border-color: var(--color-accent); }
  .radio.checked::after {
    content: ''; position: absolute; inset: 3px; border-radius: 50%;
    background: var(--color-accent);
  }
  .note { color: var(--color-text-secondary); font-size: 13px; margin: 0; }
</style>
