<script lang="ts">
  import { getLocale } from '$lib/paraglide/runtime';
  import LegalDocument from '$lib/legal/LegalDocument.svelte';
  import { privacyContent } from '$lib/legal/privacy';
  import type { LegalLocale } from '$lib/legal/types';

  const locale = $derived((getLocale() as LegalLocale) in privacyContent ? (getLocale() as LegalLocale) : 'de');
  const doc = $derived(privacyContent[locale]);
</script>

<svelte:head>
  <title>{doc.title} — TT Playbook Trainer</title>
</svelte:head>

<LegalDocument {doc} />
