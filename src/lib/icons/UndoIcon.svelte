<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 20 }: Props = $props();
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
  <path d="M3 7v6h6" />
  <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
</svg>
