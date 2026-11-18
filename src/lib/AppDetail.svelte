<script lang="ts">
  import Icon from "./Icon.svelte";
  import AppIcon from "./AppIcon.svelte";
  import AppAction from "./AppAction.svelte";
  import { store, fmtSize, fmtDate } from "./store.svelte";
  import { appById, CATEGORIES } from "./catalog";
  import { md } from "./md";

  let { id }: { id: string } = $props();
  const app = $derived(appById(id)!);
  const rel = $derived(app.available ? store.latest() : null);
  const exe = $derived(rel?.assets.find((a) => a.name.endsWith("_x64-setup.exe")));
  const inst = $derived(store.installed[id]);
  let shot = $state(0);
  const close = () => (store.detail = null);
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && close()} />

<div class="scrim" role="presentation" onclick={close}>
  <div class="sheet glass" role="dialog" aria-modal="true" aria-label={app.name} tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
    <button class="x" onclick={close} aria-label="Close"><Icon name="close" size={14} /></button>
    <div class="top">
      <AppIcon {app} size={112} />
      <div class="t">
        <h2>{app.name}</h2>
        <p class="muted">{app.subtitle}</p>
        <div class="act"><AppAction {app} big /></div>
      </div>
    </div>

    <div class="facts">
      <div><small>VERSION</small><b>{app.available ? (rel?.tag ?? "—") : "Planned"}</b></div>
      <div><small>SIZE</small><b>{exe ? fmtSize(exe.size) : "—"}</b></div>
      <div><small>CATEGORY</small><b>{CATEGORIES.find((c) => c.id === app.category)?.name}</b></div>
      <div><small>LICENSE</small><b>GPL-3.0</b></div>
      <div><small>PRICE</small><b>Free</b></div>
      <div><small>ON THIS PC</small><b>{inst?.installed ? `Installed ${inst.version}` : "Not installed"}</b></div>
    </div>

    {#if app.shots?.length}
      <div class="shots">
        <img src={app.shots[shot].src} alt={app.shots[shot].title} />
        <div class="dots">
          {#each app.shots as s, i}<button class:on={i === shot} onclick={() => (shot = i)} aria-label={s.title}>{s.title}</button>{/each}
        </div>
      </div>
    {/if}

    <p class="desc">{app.description}</p>
    {#if app.available}
      <p class="safe muted"><Icon name="shield" size={14} /> Get downloads the installer from the project's GitHub release and checks its SHA-256 before running it.</p>
    {/if}

    {#if rel}
      <h3>What's new <span class="muted">· {rel.tag} · {fmtDate(rel.published_at)}</span></h3>
      <div class="notes">{@html md(rel.body, 40)}</div>
    {/if}
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    padding: 40px;
    animation: fade 0.15s;
  }
  .sheet {
    position: relative;
    width: min(860px, 100%);
    max-height: 100%;
    overflow-y: auto;
    border-radius: 26px;
    padding: 28px 30px;
    background: linear-gradient(180deg, rgba(40, 42, 52, 0.82), rgba(26, 27, 34, 0.86));
    animation: pop 0.18s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.97);
      opacity: 0;
    }
  }
  .x {
    position: absolute;
    right: 16px;
    top: 16px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.1);
  }
  .top {
    display: flex;
    gap: 22px;
    align-items: center;
  }
  .t h2 {
    font-size: 28px;
    font-weight: 750;
  }
  .act {
    margin-top: 12px;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    margin: 22px 0;
    padding: 12px 0;
    border-top: 1px solid var(--stroke-soft);
    border-bottom: 1px solid var(--stroke-soft);
  }
  .facts div {
    display: grid;
    justify-items: center;
    gap: 4px;
    text-align: center;
    border-left: 1px solid var(--stroke-soft);
    padding: 0 6px;
  }
  .facts div:first-child {
    border-left: 0;
  }
  .facts small {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--text-3);
  }
  .facts b {
    font-size: 14px;
  }
  .shots img {
    width: 100%;
    border-radius: 16px;
    border: 1px solid var(--stroke);
    display: block;
  }
  .dots {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-top: 10px;
  }
  .dots button {
    font-size: 12.5px;
    padding: 4px 12px;
    border-radius: 999px;
    color: var(--text-2);
  }
  .dots button.on {
    background: rgba(255, 255, 255, 0.14);
    color: var(--text);
  }
  .desc {
    margin-top: 18px;
    font-size: 15px;
    line-height: 1.55;
  }
  .safe {
    margin-top: 10px;
    font-size: 12.5px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  h3 {
    margin: 22px 0 6px;
    font-size: 17px;
  }
  .notes {
    font-size: 13.5px;
    line-height: 1.55;
    color: rgba(235, 235, 245, 0.8);
    user-select: text;
  }
  .notes :global(h4) {
    margin: 10px 0 2px;
    font-size: 14px;
  }
  .notes :global(ul) {
    margin: 4px 0;
    padding-left: 20px;
  }
  .notes :global(code) {
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 12px;
  }
</style>
