<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { DEFAULT_STROKE_TYPE_CODES } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel } from '$lib/i18n/stroke-type-labels';

  const rows = DEFAULT_STROKE_TYPE_CODES.map((code) => strokeTypeLabel(code));
</script>

<section class="notation">
  <h2>{m.settings_notation_title()}</h2>
  <p class="intro">{m.settings_notation_intro()}</p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col" class="col-code">{m.settings_notation_col_code()}</th>
          <th scope="col" class="col-name">{m.settings_notation_col_name()}</th>
          <th scope="col" class="col-desc">{m.settings_notation_col_desc()}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.code)}
          <tr>
            <td class="col-code"><code class="code-badge">{row.short}</code></td>
            <td class="col-name">{row.full}</td>
            <td class="col-desc">{row.desc}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .notation {
    padding: 40px;
    max-width: 820px;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 10px 0;
  }

  .intro {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.55;
    margin: 0 0 24px 0;
  }

  .table-wrap {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    background: var(--bg-surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  thead th {
    text-align: left;
    padding: 12px 14px;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  tbody tr + tr {
    border-top: 1px solid var(--color-border);
  }

  tbody td {
    padding: 12px 14px;
    vertical-align: top;
    line-height: 1.5;
  }

  .col-code {
    width: 92px;
    white-space: nowrap;
  }

  .col-name {
    width: 200px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .col-desc {
    color: var(--color-text-secondary);
  }

  .code-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--color-accent);
    color: #fff;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  @media (max-width: 767.98px) {
    .notation {
      padding: 20px 16px;
    }

    .table-wrap {
      border: none;
      background: transparent;
      overflow-x: visible;
    }

    table,
    thead,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    thead {
      display: none;
    }

    tbody tr {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--color-border);
      background: var(--bg-surface);
    }

    tbody tr + tr {
      margin-top: 10px;
      border-top: 1px solid var(--color-border);
    }

    tbody td {
      padding: 0;
    }

    .col-code {
      width: auto;
      margin-bottom: 6px;
    }

    .col-name {
      width: auto;
      margin-bottom: 4px;
      font-size: 15px;
    }

    .col-desc {
      font-size: 13px;
    }
  }
</style>
