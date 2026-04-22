<script lang="ts">
  import { m } from '$lib/paraglide/messages';
</script>

<section class="help">
  <h2>{m.settings_help_title()}</h2>

  <p class="intro">{m.help_intro()}</p>

  <article>
    <h3>{m.help_s1_title()}</h3>
    <ul>
      <li>{@html m.help_s1_register()}</li>
      <li>{@html m.help_s1_signin()}</li>
      <li>{@html m.help_s1_pro()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s2_title()}</h3>
    <p>{m.help_s2_intro()}</p>
    <ul>
      <li>{@html m.help_s2_draw()}</li>
      <li>{@html m.help_s2_colors()}</li>
      <li>{@html m.help_s2_tag()}</li>
      <li>{@html m.help_s2_freetext()}</li>
      <li>{@html m.help_s2_reps()}</li>
      <li>{@html m.help_s2_delete()}</li>
      <li>{@html m.help_s2_undo()}</li>
      <li>{@html m.help_s2_new()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s3_title()}</h3>
    <ul>
      <li>{m.help_s3_save()}</li>
      <li>{m.help_s3_overwrite()}</li>
      <li>{@html m.help_s3_sync_intro()}</li>
      <li>{@html m.help_s3_sync_status()}</li>
      <li>{@html m.help_s3_sync_offline()}</li>
      <li>{@html m.help_s3_sync_manual()}</li>
      <li>{@html m.help_s3_sync_merge()}</li>
      <li>{@html m.help_s3_sync_reset()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s4_title()}</h3>
    <ul>
      <li>{@html m.help_s4_overview()}</li>
      <li>{@html m.help_s4_search()}</li>
      <li>{@html m.help_s4_filter()}</li>
      <li>{@html m.help_s4_actions()}</li>
      <li>{@html m.help_s4_open()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s5_title()}</h3>
    <p>{m.help_s5_intro()}</p>
    <ul>
      <li>{@html m.help_s5_create()}</li>
      <li>{@html m.help_s5_add()}</li>
      <li>{@html m.help_s5_reorder()}</li>
      <li>{@html m.help_s5_play()}</li>
      <li>{m.help_s5_limit()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s_share_title()}</h3>
    <p>{m.help_s_share_intro()}</p>
    <ul>
      <li>{@html m.help_s_share_create()}</li>
      <li>{@html m.help_s_share_view()}</li>
      <li>{@html m.help_s_share_viewer_message()}</li>
      <li>{@html m.help_s_share_viewer_coaching()}</li>
      <li>{@html m.help_s_share_manage()}</li>
      <li>{@html m.help_s_share_expire()}</li>
      <li>{m.help_s_share_privacy()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s6_title()}</h3>
    <p>{m.help_s6_intro()}</p>
    <ol>
      <li>{@html m.help_s6_step1()}</li>
      <li>{m.help_s6_step2()}</li>
      <li>{m.help_s6_step3()}</li>
      <li>{m.help_s6_step4()}</li>
      <li>{@html m.help_s6_step5_wifi()}</li>
      <li>{@html m.help_s6_step6_theme()}</li>
    </ol>
  </article>

  <article>
    <h3>{m.help_s7_title()}</h3>
    <ul>
      <li>{@html m.help_s7_free()}</li>
      <li>{@html m.help_s7_pro()}</li>
      <li>{@html m.help_s7_buy()}</li>
      <li>{@html m.help_s7_manage()}</li>
      <li>{@html m.help_s7_cancel()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s8_title()}</h3>
    <ul>
      <li>{@html m.help_s8_account()}</li>
      <li>{@html m.help_s8_language()}</li>
      <li>{@html m.help_s8_tv()}</li>
      <li>{@html m.help_s8_display()}</li>
      <li>{@html m.help_s8_pro()}</li>
      <li>{@html m.help_s8_help()}</li>
      <li>{@html m.help_s8_about()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s9_title()}</h3>
    <ul>
      <li>{m.help_s9_pair_first()}</li>
      <li>{m.help_s9_lists()}</li>
      <li>{m.help_s9_freetext()}</li>
      <li>{m.help_s9_theme()}</li>
    </ul>
  </article>

  <article>
    <h3>{m.help_s10_title()}</h3>
    <p>{@html m.help_s10_contact()}</p>
  </article>
</section>

<style>
  .help {
    padding: 40px;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 10px;
  }
  .intro {
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }
  article {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    padding: 20px 22px;
  }
  ul,
  ol {
    margin: 0;
    padding: 0 0 0 22px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.65;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  p {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.65;
  }
  article p:last-child {
    margin-bottom: 0;
  }
  :global(.help strong) {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  :global(.help em) {
    color: var(--color-text-secondary);
    font-style: normal;
  }
  :global(.help code) {
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 13px;
    font-family: ui-monospace, monospace;
    color: var(--color-text-primary);
  }
  :global(.help a) {
    color: var(--color-accent);
    text-decoration: none;
  }
  :global(.help a:hover) {
    text-decoration: underline;
  }

  @media (max-width: 767.98px) {
    .help {
      padding: 20px 16px;
      gap: 18px;
    }
    article {
      padding: 16px 18px;
    }
  }
</style>
