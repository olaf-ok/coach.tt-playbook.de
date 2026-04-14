<script lang="ts">
  import '../../app.css';
  let { children } = $props();
</script>

<div class="tv-shell">
  {@render children()}
</div>

<style>
  .tv-shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
