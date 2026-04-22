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
  <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 19.5z" />
  <path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H20" />
  <line x1="8" y1="8" x2="16" y2="8" />
  <line x1="8" y1="12" x2="13" y2="12" />
</svg>
