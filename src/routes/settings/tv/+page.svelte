<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import QrScanner from '$lib/components/QrScanner.svelte';
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { tvSession } from '$lib/tv/session.svelte';
  import { decodeCode } from '$lib/tv/decodeCode';
  import { m } from '$lib/paraglide/messages';

  const client = tvSession.ensureClient();
  let codeInput = $state('');
  let scannerOpen = $state(false);

  onMount(() => {
    const urlCode = $page.url.searchParams.get('code');
    if (urlCode && /^\d{4}$/.test(urlCode)) {
      codeInput = urlCode;
      submit();
    }
  });

  function submit() {
    if (!/^\d{4}$/.test(codeInput)) return;
    client.pairAsTablet(codeInput);
  }

  function handleScanned(text: string) {
    const code = decodeCode(text);
    if (!code) return;
    scannerOpen = false;
    codeInput = code;
    submit();
  }

  $effect(() => {
    if (client.status !== 'paired') return;
    const ex = currentExercise.exercise;
    void ex.strokes.length;
    void ex.name;
    void ex.repetitions;
    void ex.duration;
    client.sendSync(ex);
  });

  onDestroy(() => {
    // Session bleibt aktiv über Navigation — nicht disconnecten
  });
</script>

<section class="connect">
  <h2>{m.settings_tv_title()}</h2>

  {#if client.status === 'paired'}
    <div class="success">
      <p>{m.settings_tv_connected()}</p>
      <p class="hint">
        {m.settings_tv_connected_hint_prefix()}<a href="/draw">{m.settings_tv_connected_hint_link()}</a>.
      </p>
      <button type="button" class="secondary" onclick={() => client.disconnect()}>{m.settings_tv_disconnect()}</button>
    </div>
  {:else if scannerOpen}
    <p class="sub">{m.settings_tv_scanner_hint()}</p>
    <QrScanner onDecoded={handleScanned} onCancel={() => (scannerOpen = false)} />
  {:else}
    <p class="sub">{m.settings_tv_pair_hint()}</p>

    <button type="button" class="primary scan-btn" onclick={() => (scannerOpen = true)}>
      {m.settings_tv_scan_button()}
    </button>

    <div class="divider"><span>{m.settings_tv_divider_or()}</span></div>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        type="text"
        inputmode="numeric"
        maxlength="4"
        bind:value={codeInput}
        placeholder={m.settings_tv_code_placeholder()}
        aria-label={m.settings_tv_code_aria()}
        autocomplete="off"
        oninput={(e) => {
          const t = e.currentTarget;
          t.value = t.value.replace(/\D/g, '').slice(0, 4);
          codeInput = t.value;
        }}
      />
      <button type="submit" class="primary" disabled={!/^\d{4}$/.test(codeInput)}>{m.settings_tv_connect()}</button>
    </form>

    {#if client.status === 'connecting'}
      <p class="status">{m.settings_tv_connecting()}</p>
    {:else if client.status === 'error'}
      <p class="error">
        {#if client.errorReason === 'unknown-code'}{m.settings_tv_error_unknown_code()}
        {:else if client.errorReason === 'already-paired'}{m.settings_tv_error_already_paired()}
        {:else if client.errorReason === 'connection-failed'}{m.settings_tv_error_connection_failed()}
        {:else}{m.settings_tv_error_generic({ reason: client.errorReason ?? '' })}
        {/if}
      </p>
    {/if}

    <p class="hint">
      {m.settings_tv_foot_hint_prefix()}<span class="path">/tv</span>{m.settings_tv_foot_hint_suffix()}
    </p>
  {/if}
</section>

<style>
  .connect {
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 540px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sub {
    color: var(--color-text-secondary);
    margin: 0;
  }
  .scan-btn {
    align-self: flex-start;
  }
  .divider {
    position: relative;
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
  .divider span {
    padding: 0 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  form {
    display: flex;
    gap: 12px;
  }
  input {
    flex: 1;
    padding: 14px 18px;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 8px;
    text-align: center;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
  }
  input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 0;
  }
  .primary,
  .secondary {
    padding: 14px 22px;
    border-radius: var(--radius-button);
    font-weight: 600;
    font-size: 15px;
  }
  .primary {
    background: var(--color-accent);
    color: #fff;
  }
  .primary[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .secondary {
    background: var(--bg-surface);
    color: var(--color-text-primary);
  }
  .success {
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .success p:first-child {
    color: var(--color-success, #34c759);
    font-weight: 600;
  }
  .hint {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  .path {
    color: var(--color-text-primary);
    font-family: ui-monospace, monospace;
  }
  .status {
    color: var(--color-text-secondary);
  }
  .error {
    color: var(--color-danger);
  }
  a {
    color: var(--color-accent);
  }
</style>
