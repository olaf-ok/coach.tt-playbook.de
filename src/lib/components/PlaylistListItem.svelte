<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { Playlist } from '$lib/types/playlist';

  interface Props {
    playlist: Playlist;
    active: boolean;
    exerciseCount: number;
    onSelect: (id: string) => void;
  }

  let { playlist, active, exerciseCount, onSelect }: Props = $props();
</script>

<button
  type="button"
  class="item"
  class:active
  onclick={() => onSelect(playlist.id)}
>
  <span class="name">{playlist.name || m.exercise_unnamed()}</span>
  <span class="meta">
    {exerciseCount === 1 ? m.archive_count_one() : m.archive_count_other({ count: exerciseCount })}
  </span>
</button>

<style>
  .item {
    width: 100%;
    text-align: left;
    padding: 12px 14px;
    border-radius: var(--radius-panel);
    background: transparent;
    color: var(--color-text-primary);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .item:hover {
    background: var(--bg-surface);
  }
  .item.active {
    background: var(--color-accent);
    color: #fff;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
  }
  .meta {
    font-size: 12px;
    opacity: 0.8;
  }
</style>
