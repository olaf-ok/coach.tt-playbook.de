<script lang="ts">
  import { getLocale } from '$lib/paraglide/runtime';
  import LegalDocument from '$lib/legal/LegalDocument.svelte';
  import { termsContent } from '$lib/legal/terms';
  import type { LegalLocale } from '$lib/legal/types';

  const locale = $derived((getLocale() as LegalLocale) in termsContent ? (getLocale() as LegalLocale) : 'de');
  const doc = $derived(termsContent[locale]);
</script>

<svelte:head>
  <title>{doc.title} — TT Playbook Trainer</title>
</svelte:head>

<LegalDocument {doc} />
