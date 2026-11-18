<script lang="ts">
  import AppIcon from "../AppIcon.svelte";
  import AppAction from "../AppAction.svelte";
  import Row from "../Row.svelte";
  import Icon from "../Icon.svelte";
  import { store, fmtDate } from "../store.svelte";
  import { APPS } from "../catalog";
  import { api } from "../api";

  const q = $derived(store.search.trim().toLowerCase());
  const has = (...s: string[]) => s.some((x) => x.toLowerCase().includes(q));
  const apps = $derived(APPS.filter((a) => has(a.name, a.subtitle, a.description)));
  const files = $derived(store.files.filter((f) => has(f.name, f.detail)).slice(0, 40));
  const news = $derived((store.gh?.releases ?? []).filter((r) => has(r.name, r.tag, r.body)));
</script>

{#if apps.length}
  <div class="section-head"><h2>Apps</h2></div>
  <div class="grid">
    {#each apps as a}
      <Row title={a.name} sub={a.subtitle} onclick={() => (store.detail = a.id)}>
        {#snippet icon()}<AppIcon app={a} size={56} />{/snippet}
        {#snippet action()}<AppAction app={a} />{/snippet}
      </Row>
    {/each}
  </div>
{/if}
{#if files.length}
  <div class="section-head"><h2>Files</h2></div>
  <div class="grid">
    {#each files as f}
      <Row title={f.name} sub={f.detail}>
        {#snippet icon()}<div class="tile"><Icon name={f.kind === "preset" ? "preset" : f.kind === "audio" ? "music" : "video"} size={22} /></div>{/snippet}
        {#snippet action()}<button class="pill" onclick={() => api.reveal(f.path)}>Show</button>{/snippet}
      </Row>
    {/each}
  </div>
{/if}
{#if news.length}
  <div class="section-head"><h2>News</h2></div>
  <div class="grid">
    {#each news as r}
      <Row title={r.name || r.tag} sub={fmtDate(r.published_at)} onclick={() => { store.search = ""; store.go("news"); }}>
        {#snippet icon()}<div class="tile"><Icon name="news" size={22} /></div>{/snippet}
      </Row>
    {/each}
  </div>
{/if}
{#if !apps.length && !files.length && !news.length}
  <p class="muted none">No results for “{store.search}”.</p>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 36px;
  }
  .tile {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.09);
    color: var(--accent-text);
    flex: none;
  }
  .none {
    margin-top: 30px;
  }
</style>
