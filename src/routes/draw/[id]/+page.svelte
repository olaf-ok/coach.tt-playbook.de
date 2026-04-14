<script lang="ts">
  import DrawingView from '$lib/components/DrawingView.svelte';
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
    if (data.exercise) {
      currentExercise.load(data.exercise);
    }
  });
</script>

<DrawingView />
