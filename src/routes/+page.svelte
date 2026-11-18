<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Icon from "$lib/Icon.svelte";
  import AppIcon from "$lib/AppIcon.svelte";
  import { store, PAGES } from "$lib/store.svelte";
  import { APPS } from "$lib/catalog";
  import { api } from "$lib/api";
  import Home from "$lib/pages/Home.svelte";
  import Apps from "$lib/pages/Apps.svelte";
  import News from "$lib/pages/News.svelte";
  import Files from "$lib/pages/Files.svelte";
  import Source from "$lib/pages/Source.svelte";
  import Search from "$lib/pages/Search.svelte";
  import AppDetail from "$lib/AppDetail.svelte";

  const win = getCurrentWindow();
  let scroller: HTMLElement | undefined = $state();
  const title = $derived(store.search.trim() ? "Search" : PAGES.find((p) => p.id === store.page)?.name ?? "");

  onMount(() => {
    store.init();
  });
  $effect(() => {
    store.page;
    scroller?.scrollTo({ top: 0 });
  });
</script>

<div class="shell">
  <div class="aurora" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>

  <aside class="sidebar glass">
    <div class="brand" data-tauri-drag-region>
      <img class="logo" src="/media/studio-icon.png" alt="" />
      <span data-tauri-drag-region>Creative Creator Studio</span>
    </div>
    <label class="search">
      <Icon name="search" size={15} />
      <input placeholder="Search" bind:value={store.search} aria-label="Search" />
      {#if store.search}<button class="x" onclick={() => (store.search = "")} aria-label="Clear search"><Icon name="close" size={12} /></button>{/if}
    </label>
    <nav>
      {#each PAGES as p}
        <button class="nav" class:on={store.page === p.id && !store.search} onclick={() => { store.search = ""; store.go(p.id); }}>
          <Icon name={p.icon} size={17} />
          <span>{p.name}</span>
        </button>
      {/each}
    </nav>
    <div class="side-label">Apps</div>
    <div class="side-apps">
      {#each APPS.filter((a) => a.available) as a}
        <button class="nav app" onclick={() => (store.detail = a.id)}>
          <AppIcon app={a} size={20} />
          <span>{a.name}</span>
          <em class:ok={store.installed[a.id]?.installed}>{store.installed[a.id]?.installed ? "Installed" : "Get"}</em>
        </button>
      {/each}
      <button class="nav app dim" onclick={() => { store.search = ""; store.go("apps"); }}>
        <span class="more"><Icon name="apps" size={12} /></span>
        <span>{APPS.filter((a) => !a.available).length} more planned</span>
      </button>
    </div>
    <div class="grow"></div>
    <button class="gh-card" onclick={() => { store.search = ""; store.go("news"); }}>
      <span class="star"><Icon name="star" size={14} fill /></span>
      <span><b>{store.gh ? store.gh.repo.stars.toLocaleString() : "—"}</b> stars on GitHub</span>
    </button>
    <div class="foot">Free & open source · GPL-3.0{store.version ? ` · v${store.version}` : ""}</div>
  </aside>

  <main>
    <header data-tauri-drag-region>
      <div class="navbtns">
        <button class="round glass" onclick={() => store.goBack()} disabled={!store.back.length || !!store.search} aria-label="Back"><Icon name="back" size={16} /></button>
        <button class="round glass" onclick={() => store.goFwd()} disabled={!store.fwd.length || !!store.search} aria-label="Forward"><Icon name="fwd" size={16} /></button>
      </div>
      <h1 data-tauri-drag-region>{title}</h1>
      <div class="winctl">
        <button onclick={() => win.minimize()} aria-label="Minimize"><Icon name="min" size={14} /></button>
        <button onclick={() => win.toggleMaximize()} aria-label="Maximize"><Icon name="max" size={12} /></button>
        <button class="close" onclick={() => win.close()} aria-label="Close"><Icon name="close" size={14} /></button>
      </div>
    </header>
    <div class="scroll" bind:this={scroller}>
      <div class="content">
        {#if store.search.trim()}
          <Search />
        {:else if store.page === "home"}
          <Home />
        {:else if store.page === "apps"}
          <Apps />
        {:else if store.page === "news"}
          <News />
        {:else if store.page === "files"}
          <Files />
        {:else}
          <Source />
        {/if}
      </div>
    </div>
  </main>

  {#if store.detail}
    <AppDetail id={store.detail} />
  {/if}

  {#if store.toast}
    <div class="toast glass" class:bad={store.toast.bad} role="status">
      <Icon name={store.toast.bad ? "info" : "check"} size={16} />
      <span>{store.toast.text}</span>
      {#if store.toast.path}<button class="pill" onclick={() => api.reveal(store.toast!.path!)}>Show</button>{/if}
    </div>
  {/if}
</div>

<style>
  .shell {
    position: relative;
    height: 100vh;
    display: grid;
    grid-template-columns: 256px 1fr;
    background: var(--tint);
    overflow: hidden;
  }
  /* soft colour fields behind the glass */
  .aurora {
    display: none; /* no coloured light fields behind the glass */
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .aurora i {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.38;
  }
  .a1 {
    width: 560px;
    height: 460px;
    left: 300px;
    top: -260px;
    background: #2563eb;
    opacity: 0.26 !important;
  }
  .a2 {
    width: 600px;
    height: 460px;
    right: -180px;
    top: 120px;
    background: #6d28d9;
    opacity: 0.22 !important;
  }
  .a3 {
    width: 520px;
    height: 420px;
    left: 30%;
    bottom: -260px;
    background: #0891b2;
    opacity: 0.22 !important;
  }

  .sidebar {
    position: relative;
    z-index: 1;
    margin: 10px 0 10px 10px;
    border-radius: 22px;
    padding: 10px 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.03));
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 40px;
    padding: 0 8px;
    font-weight: 650;
    font-size: 14.5px;
    letter-spacing: -0.01em;
  }
  .logo {
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: 7px;
    object-fit: cover;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 32px;
    margin: 4px 2px 10px;
    padding: 0 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid var(--stroke-soft);
    color: var(--text-3);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    outline: none;
    color: var(--text);
  }
  .search input::placeholder {
    color: var(--text-3);
  }
  .search .x {
    color: var(--text-3);
    display: grid;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 10px;
    border-radius: 10px;
    text-align: left;
    color: var(--text);
    font-size: 14px;
  }
  .nav :global(svg) {
    color: var(--accent-text);
  }
  .nav:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .nav.on {
    background: linear-gradient(180deg, #2b8cff, #0a72e8);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
    font-weight: 600;
  }
  .nav.on :global(svg) {
    color: #fff;
  }
  .side-label {
    margin: 16px 10px 4px;
    font-size: 11.5px;
    font-weight: 650;
    color: var(--text-3);
  }
  .side-apps {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav.app span {
    flex: 1;
  }
  .nav.app em {
    font-style: normal;
    font-size: 11.5px;
    color: var(--accent-text);
  }
  .nav.app em.ok {
    color: var(--text-3);
  }
  .nav.dim {
    color: var(--text-2);
  }
  .more {
    flex: none !important;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.08);
  }
  .grow {
    flex: 1;
  }
  .gh-card {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--stroke-soft);
    text-align: left;
    font-size: 13px;
    color: var(--text-2);
  }
  .gh-card b {
    color: var(--text);
  }
  .star {
    color: #ffd60a;
    display: grid;
  }
  .foot {
    margin: 10px 6px 0;
    font-size: 11px;
    color: var(--text-3);
  }

  main {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 60px;
    padding: 0 0 0 28px;
    flex: none;
  }
  .navbtns {
    display: flex;
    gap: 6px;
  }
  .round {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--text);
  }
  .round:disabled {
    color: var(--text-3);
    cursor: default;
  }
  header h1 {
    flex: 1;
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .winctl {
    display: flex;
    align-self: flex-start;
  }
  .winctl button {
    width: 46px;
    height: 34px;
    display: grid;
    place-items: center;
    color: var(--text-2);
  }
  .winctl button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }
  .winctl .close:hover {
    background: #e81123;
    color: #fff;
  }
  .scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }
  .content {
    max-width: 1500px;
    padding: 4px 34px 48px 28px;
  }

  .toast {
    position: fixed;
    z-index: 50;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 640px;
    padding: 10px 12px 10px 16px;
    border-radius: 16px;
    background: rgba(40, 42, 50, 0.72);
    font-size: 13.5px;
  }
  .toast :global(svg) {
    color: var(--green);
    flex: none;
  }
  .toast.bad :global(svg) {
    color: var(--red);
  }
</style>
