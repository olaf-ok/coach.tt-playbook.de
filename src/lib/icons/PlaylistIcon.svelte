<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 22 }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M4 6h12" />
  <path d="M4 12h12" />
  <path d="M4 18h8" />
  <path d="M17 14.5v6l5-3z" fill="currentColor" stroke="none" />
</svg>
