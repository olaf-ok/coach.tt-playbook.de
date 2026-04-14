<script lang="ts">
  import { theme, type ThemeMode } from '$lib/theme/store.svelte';
  import SunIcon from '$lib/icons/SunIcon.svelte';
  import MoonIcon from '$lib/icons/MoonIcon.svelte';
  import AutoThemeIcon from '$lib/icons/AutoThemeIcon.svelte';

  const options: Array<{ value: ThemeMode; label: string; hint: string; icon: typeof SunIcon }> = [
    { value: 'auto', label: 'System', hint: 'Folgt den Geräteeinstellungen.', icon: AutoThemeIcon },
    { value: 'light', label: 'Hell', hint: 'Hellgrauer Hintergrund, helle Karten.', icon: SunIcon },
    { value: 'dark', label: 'Dunkel', hint: 'Dunkler Hintergrund, gut bei dunkler Halle.', icon: MoonIcon },
  ];
</script>

<section class="display">
  <h2>Anzeige</h2>

  <div class="group">
    <p class="group-title">Erscheinungsbild</p>
    <div class="options">
      {#each options as opt (opt.value)}
        {@const Icon = opt.icon}
        <button
          type="button"
          class="option"
          class:active={theme.mode === opt.value}
          onclick={() => theme.set(opt.value)}
        >
          <span class="icon"><Icon /></span>
          <span class="text">
            <span class="label">{opt.label}</span>
            <span class="hint">{opt.hint}</span>
          </span>
          <span class="radio" class:checked={theme.mode === opt.value} aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  </div>

  <p class="note">
    Aktuell aktiv: <strong>{theme.resolved === 'light' ? 'Hell' : 'Dunkel'}</strong>
    {#if theme.mode === 'auto'} (System){/if}
  </p>
</section>

<style>
  .display {
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
  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .group-title {
    color: var(--color-text-secondary);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
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
  .option:last-child {
    border-bottom: 0;
  }
  .option:hover {
    background: var(--color-chip-bg);
  }
  .option.active {
    background: var(--color-chip-bg);
  }
  .icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--color-chip-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    flex-shrink: 0;
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .label {
    color: var(--color-text-primary);
    font-size: 15px;
    font-weight: 500;
  }
  .hint {
    color: var(--color-text-secondary);
    font-size: 12px;
  }
  .radio {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    position: relative;
    flex-shrink: 0;
  }
  .radio.checked {
    border-color: var(--color-accent);
  }
  .radio.checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--color-accent);
  }
  .note {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0;
  }
  strong {
    color: var(--color-text-primary);
  }
</style>
