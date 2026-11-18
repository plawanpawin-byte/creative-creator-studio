<script lang="ts">
  // Get / Open / Planned capsule with a live download ring.
  import type { AppEntry } from "./catalog";
  import { store } from "./store.svelte";
  let { app, big = false }: { app: AppEntry; big?: boolean } = $props();
  const task = $derived(`install:${app.id}`);
  const p = $derived(store.progress[task]);
  const pct = $derived(p && p.total ? Math.min(1, p.done / p.total) : 0);
  const inst = $derived(store.installed[app.id]);
</script>

{#if !app.available}
  <button class="pill" class:big disabled title="Planned — not built yet">Soon</button>
{:else if store.busy[task]}
  <button class="pill busy" class:big disabled title={p?.phase ?? "Working"} aria-label={p?.phase ?? "Working"}>
    <svg width="18" height="18" viewBox="0 0 20 20" class:spin={!p || !p.total}>
      <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2.5" />
      <circle cx="10" cy="10" r="8" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray={p && p.total ? `${pct * 50.3} 50.3` : "14 50.3"} transform="rotate(-90 10 10)" />
    </svg>
    {#if big}<span>{p?.phase ?? "Starting"}{p && p.total ? ` ${Math.round(pct * 100)}%` : ""}</span>{/if}
  </button>
{:else if inst?.installed}
  <button class="pill" class:big class:solid={big} onclick={(e) => { e.stopPropagation(); store.launch(app.id); }}>Open</button>
{:else}
  <button class="pill" class:big class:solid={big} onclick={(e) => { e.stopPropagation(); store.install(app.id); }}>Get</button>
{/if}

<style>
  .big {
    height: 34px;
    min-width: 96px;
    font-size: 14.5px;
  }
  .busy {
    min-width: 68px;
    color: var(--text-2) !important;
  }
  .spin {
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
