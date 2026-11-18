<script lang="ts">
  import Icon from "../Icon.svelte";
  import AppIcon from "../AppIcon.svelte";
  import Row from "../Row.svelte";
  import { store, fmtSize, fmtDate } from "../store.svelte";
  import { APPS } from "../catalog";
  import { api, type SavedFile } from "../api";

  type Kind = "all" | "preset" | "video" | "audio";
  let kind = $state<Kind>("all");
  const KINDS: { id: Kind; name: string }[] = [
    { id: "all", name: "All" },
    { id: "preset", name: "Presets" },
    { id: "video", name: "Videos" },
    { id: "audio", name: "Audio" },
  ];
  const TILE: Record<string, { icon: string; from: string; to: string }> = {
    preset: { icon: "preset", from: "#5e5ce6", to: "#0a84ff" },
    video: { icon: "video", from: "#ff375f", to: "#ff9f0a" },
    audio: { icon: "music", from: "#30d158", to: "#0a84ff" },
  };
  const sub = (f: SavedFile) => [f.detail, f.size ? fmtSize(f.size) : "", fmtDate(f.modified)].filter(Boolean).join(" · ");
  const withFiles = $derived(APPS.filter((a) => a.available || store.files.some((f) => f.app === a.id)));
  const act = (f: SavedFile) => api.reveal(f.path).catch((e) => store.say(String(e), true));
  const openF = (f: SavedFile) => api.openFile(f.path).catch((e) => store.say(String(e), true));
</script>

<div class="top">
  <div class="seg glass" role="tablist" aria-label="File type">
    {#each KINDS as k}
      <button role="tab" aria-selected={kind === k.id} class:on={kind === k.id} onclick={() => (kind = k.id)}>{k.name} <em>{k.id === "all" ? store.files.length : store.files.filter((f) => f.kind === k.id).length}</em></button>
    {/each}
  </div>
  <button class="pill" onclick={() => store.loadFiles()}><Icon name="refresh" size={14} />Refresh</button>
</div>

{#each withFiles as a}
  {@const list = store.files.filter((f) => f.app === a.id && (kind === "all" || f.kind === kind))}
  <div class="section-head">
    <AppIcon app={a} size={26} />
    <h2>{a.name}</h2><span class="chev"><Icon name="chev" size={16} /></span>
  </div>
  <div class="section-sub">Presets you saved and files you exported in {a.name}</div>
  {#if list.length}
    <div class="grid">
      {#each list as f (f.kind + f.path + f.name)}
        {@const t = TILE[f.kind]}
        <Row title={f.name} sub={sub(f)} label={`${f.name} — ${f.kind}`} onclick={f.kind === "preset" ? undefined : () => openF(f)}>
          {#snippet icon()}<div class="tile" style="--from:{t.from};--to:{t.to}"><Icon name={t.icon} size={26} /></div>{/snippet}
          {#snippet action()}<button class="pill" onclick={() => act(f)} aria-label={`Show ${f.name} in folder`}>Show</button>{/snippet}
        </Row>
      {/each}
    </div>
  {:else}
    <div class="empty glass">
      <Icon name="files" size={26} />
      <span>{store.filesLoaded ? (kind === "all" ? `Nothing saved in ${a.name} yet. Presets you save and files you export will show up here.` : "No files of this type.") : "Looking for files…"}</span>
    </div>
  {/if}
{/each}

<style>
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .seg {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
  }
  .seg button {
    height: 30px;
    padding: 0 14px;
    border-radius: 9px;
    font-size: 13.5px;
    color: var(--text-2);
  }
  .seg em {
    font-style: normal;
    color: var(--text-3);
    font-size: 12px;
    margin-left: 3px;
  }
  .seg button.on {
    background: rgba(255, 255, 255, 0.16);
    color: var(--text);
    font-weight: 600;
    box-shadow: var(--sheen);
  }
  .section-head {
    align-items: center;
    gap: 10px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 36px;
  }
  .tile {
    flex: none;
    width: 60px;
    height: 60px;
    border-radius: 15px;
    display: grid;
    place-items: center;
    color: #fff;
    background: linear-gradient(145deg, var(--from), var(--to));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 6px 18px rgba(0, 0, 0, 0.3);
  }
  .empty {
    border-radius: 16px;
    padding: 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--text-2);
  }
</style>
