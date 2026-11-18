<script lang="ts">
  import Icon from "../Icon.svelte";
  import AppIcon from "../AppIcon.svelte";
  import Row from "../Row.svelte";
  import { store, fmtDate } from "../store.svelte";
  import { APPS, CATEGORIES, appById } from "../catalog";
  import { api } from "../api";

  let sel = $state<string | null>(null);
  const app = $derived(sel ? appById(sel) : null);
  const repo = "https://github.com/plawanpawin-byte/squzze";
  const clone = `git clone ${repo}.git`;
  const latestTag = $derived(store.latest()?.tag ?? null);
  const pct = (task: string) => {
    const p = store.progress[task];
    return p && p.total ? ` ${Math.round((100 * p.done) / p.total)}%` : p ? ` ${(p.done / 1e6).toFixed(1)} MB` : "";
  };
  let copied = $state(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(clone);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      store.say("Could not copy", true);
    }
  }
</script>

{#snippet dl(id: string, tag: string | null, label: string, solid = false)}
  {@const task = `source:${id}:${tag ?? "main"}`}
  <button class="pill" class:solid onclick={(e) => { e.stopPropagation(); store.downloadSource(id, tag); }} disabled={store.busy[task]}>
    <Icon name="download" size={14} />{store.busy[task] ? `Downloading${pct(task)}` : label}
  </button>
{/snippet}

{#if !app}
  <p class="intro muted">Every app in the suite is free software under the GPL-3.0. Pick an app to get its source code.</p>
  {#each CATEGORIES as c}
    {@const list = APPS.filter((a) => a.category === c.id)}
    <div class="section-head"><h2>{c.name}</h2><span class="chev"><Icon name="chev" size={16} /></span></div>
    <div class="grid">
      {#each list as a}
        <Row title={a.name} sub={a.available ? `Source · GPL-3.0 · ${a.stack ?? ""}` : "Source not published yet"} onclick={() => (sel = a.id)}>
          {#snippet icon()}<AppIcon app={a} size={60} />{/snippet}
          {#snippet action()}
            {#if a.available}{@render dl(a.id, latestTag, "Get")}{:else}<button class="pill" disabled>Soon</button>{/if}
          {/snippet}
        </Row>
      {/each}
    </div>
  {/each}
{:else}
  <button class="crumb" onclick={() => (sel = null)}><Icon name="back" size={14} /> All source code</button>
  <section class="head glass">
    <AppIcon app={app} size={96} />
    <div class="info">
      <div class="eyebrow">SOURCE CODE</div>
      <h2>{app.name}</h2>
      <p class="muted">{app.available ? `${app.stack} · GPL-3.0-or-later` : "This app is planned. Its source will be published here when work starts."}</p>
      {#if app.available}
        <div class="btns">
          {@render dl(app.id, latestTag, latestTag ? `Download source code (${latestTag})` : "Download source code", true)}
          <button class="pill" onclick={() => api.openUrl(repo)}>View on GitHub <Icon name="external" size={13} /></button>
        </div>
      {/if}
    </div>
  </section>

  {#if app.available}
    <div class="section-head"><h2>Clone with Git</h2></div>
    <div class="clone glass">
      <code>{clone}</code>
      <button class="pill" onclick={copy}><Icon name={copied ? "check" : "copy"} size={14} />{copied ? "Copied" : "Copy"}</button>
    </div>

    <div class="section-head"><h2>All versions</h2></div>
    <div class="section-sub">Each version as a .zip file, saved to your Downloads folder</div>
    <div class="list glass">
      <div class="ver">
        <span class="tag mono">main</span>
        <span class="muted">Latest code, may be unfinished</span>
        <span class="grow"></span>
        {@render dl(app.id, null, "Download")}
      </div>
      {#each store.gh?.releases ?? [] as r}
        <div class="ver">
          <span class="tag mono">{r.tag}</span>
          <span>{r.name}</span>
          <span class="muted">{fmtDate(r.published_at)}</span>
          <span class="grow"></span>
          {@render dl(app.id, r.tag, "Download")}
        </div>
      {/each}
    </div>
    <p class="note muted"><Icon name="shield" size={14} /> Downloads come straight from GitHub. The licence lets you use, study, change and share the code.</p>
  {/if}
{/if}

<style>
  .intro {
    font-size: 14.5px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 36px;
  }
  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--accent-text);
    margin-bottom: 14px;
  }
  .head {
    border-radius: 22px;
    padding: 24px;
    display: flex;
    gap: 22px;
    align-items: center;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }
  .info h2 {
    font-size: 28px;
    font-weight: 750;
  }
  .btns {
    display: flex;
    gap: 10px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .clone {
    border-radius: 14px;
    padding: 10px 10px 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .clone code {
    flex: 1;
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 13.5px;
    user-select: text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .list {
    border-radius: 16px;
    padding: 4px 16px;
  }
  .ver {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 11px 0;
    border-bottom: 1px solid var(--stroke-soft);
  }
  .ver:last-child {
    border-bottom: 0;
  }
  .tag {
    min-width: 110px;
    font-size: 13px;
  }
  .mono {
    font-family: "Cascadia Mono", Consolas, monospace;
  }
  .grow {
    flex: 1;
  }
  .note {
    margin-top: 18px;
    font-size: 12.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
