<script lang="ts">
  import Icon from "../Icon.svelte";
  import AppIcon from "../AppIcon.svelte";
  import { store, fmtDate, ago, fmtSize } from "../store.svelte";
  import { appById } from "../catalog";
  import { api } from "../api";
  import { md } from "../md";

  const sq = appById("squeeze")!;
  const r = $derived(store.gh?.repo);
  let open = $state<Record<string, boolean>>({});
</script>

<div class="top">
  <div class="sub muted">
    {#if store.gh}Updated {ago(store.gh.fetched_at)}{/if}
    {#if store.ghError}<span class="warn">· Offline — showing saved data ({store.ghError})</span>{/if}
  </div>
  <button class="pill" onclick={() => store.loadGithub(true)} disabled={store.ghLoading}><Icon name="refresh" size={14} />{store.ghLoading ? "Refreshing…" : "Refresh"}</button>
</div>

{#if !store.gh && !store.ghLoading}
  <div class="empty glass">
    <Icon name="news" size={30} />
    <b>No news yet</b>
    <span class="muted">Could not reach GitHub{store.ghError ? `: ${store.ghError}` : ""}. Connect to the internet and press Refresh.</span>
  </div>
{:else}
  <section class="stars glass">
    <div class="big">
      <span class="y"><Icon name="star" size={34} fill /></span>
      <div>
        <div class="num" aria-label="GitHub stars">{r ? r.stars.toLocaleString() : "…"}</div>
        <div class="muted">stars on GitHub</div>
      </div>
    </div>
    <div class="facts">
      <div><Icon name="fork" size={16} /><b>{r?.forks ?? "…"}</b><span>forks</span></div>
      <div><Icon name="eye" size={16} /><b>{r?.watchers ?? "…"}</b><span>watching</span></div>
      <div><Icon name="issue" size={16} /><b>{r?.open_issues ?? "…"}</b><span>open issues</span></div>
      <div><Icon name="clock" size={16} /><b>{r ? ago(r.pushed_at) : "…"}</b><span>last change</span></div>
    </div>
    <button class="pill" onclick={() => api.openUrl(r?.html_url || "https://github.com/plawanpawin-byte/squzze")}>Star on GitHub <Icon name="external" size={13} /></button>
  </section>

  <div class="section-head"><h2>Releases</h2></div>
  <div class="section-sub">News from our own apps only</div>
  <div class="feed">
    {#each store.gh?.releases ?? [] as rel, i}
      {@const key = rel.tag}
      <article class="post glass">
        <header>
          <AppIcon app={sq} size={44} />
          <div class="meta">
            <div class="eyebrow">SQUEEZE · {fmtDate(rel.published_at).toUpperCase()}</div>
            <h3>{rel.name || rel.tag}</h3>
          </div>
          <div class="badges">
            {#if i === 0}<span class="badge new">Latest</span>{/if}
            {#if rel.prerelease}<span class="badge">Beta</span>{/if}
            <span class="badge mono">{rel.tag}</span>
          </div>
        </header>
        <div class="body" class:clip={!open[key]}>{@html md(rel.body)}</div>
        <footer>
          {#if rel.body.split("\n").length > 8}<button class="pill" onclick={() => (open = { ...open, [key]: !open[key] })}>{open[key] ? "Less" : "More"}</button>{/if}
          {#each rel.assets.filter((a) => a.name.endsWith(".exe")) as a}<span class="muted asset"><Icon name="download" size={13} /> {a.name} · {fmtSize(a.size)}</span>{/each}
          <span class="grow"></span>
          <button class="pill" onclick={() => api.openUrl(rel.html_url)}>View on GitHub <Icon name="external" size={13} /></button>
        </footer>
      </article>
    {:else}
      <p class="muted">No releases yet.</p>
    {/each}
  </div>
{/if}

<style>
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .sub {
    font-size: 13px;
  }
  .warn {
    color: var(--orange);
  }
  .empty {
    border-radius: 18px;
    padding: 40px;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }
  .stars {
    border-radius: 22px;
    padding: 24px 26px;
    display: flex;
    align-items: center;
    gap: 34px;
    flex-wrap: wrap;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0.035));
  }
  .big {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .y {
    color: #ffd60a;
    display: grid;
  }
  .num {
    font-size: 48px;
    font-weight: 750;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .facts {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    min-width: 380px;
  }
  .facts div {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 8px;
    align-items: center;
    color: var(--text-2);
  }
  .facts b {
    color: var(--text);
    font-size: 17px;
  }
  .facts span {
    grid-column: 2;
    font-size: 12.5px;
  }
  .feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .post {
    border-radius: 20px;
    padding: 20px 22px;
  }
  .post header {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .meta {
    flex: 1;
    min-width: 0;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }
  .meta h3 {
    font-size: 18px;
    font-weight: 700;
  }
  .badges {
    display: flex;
    gap: 6px;
  }
  .badge {
    font-size: 11.5px;
    padding: 3px 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    color: var(--text-2);
  }
  .badge.new {
    background: rgba(10, 132, 255, 0.25);
    color: #8cc4ff;
  }
  .mono {
    font-family: "Cascadia Mono", Consolas, monospace;
  }
  .body {
    margin: 14px 0 6px 58px;
    font-size: 14px;
    line-height: 1.55;
    color: rgba(235, 235, 245, 0.82);
    user-select: text;
  }
  .body.clip {
    max-height: 190px;
    overflow: hidden;
    mask-image: linear-gradient(180deg, #000 70%, transparent);
  }
  .body :global(h4) {
    margin: 12px 0 4px;
    font-size: 14.5px;
    color: var(--text);
  }
  .body :global(ul) {
    margin: 4px 0;
    padding-left: 20px;
  }
  .body :global(p) {
    margin: 4px 0;
  }
  .body :global(code) {
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 12.5px;
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 5px;
  }
  .post footer {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0 0 58px;
    flex-wrap: wrap;
  }
  .asset {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
  }
  .grow {
    flex: 1;
  }
</style>
