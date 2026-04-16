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
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M4 10h11a5 5 0 0 1 0 10H9" />
  <path d="M4 10l4-4" />
  <path d="M4 10l4 4" />
</svg>
