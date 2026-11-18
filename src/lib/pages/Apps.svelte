<script lang="ts">
  import Icon from "../Icon.svelte";
  import AppIcon from "../AppIcon.svelte";
  import AppAction from "../AppAction.svelte";
  import Row from "../Row.svelte";
  import { store } from "../store.svelte";
  import { APPS, CATEGORIES, type Category } from "../catalog";

  let cat = $state<Category | "all">("all");
  const shown = $derived(CATEGORIES.filter((c) => cat === "all" || c.id === cat));
</script>

<div class="seg glass" role="tablist" aria-label="Category">
  <button role="tab" aria-selected={cat === "all"} class:on={cat === "all"} onclick={() => (cat = "all")}>All</button>
  {#each CATEGORIES as c}
    <button role="tab" aria-selected={cat === c.id} class:on={cat === c.id} onclick={() => (cat = c.id)}>{c.name}</button>
  {/each}
</div>

{#each shown as c}
  {@const list = APPS.filter((a) => a.category === c.id)}
  <div class="section-head"><h2>{c.name}</h2><span class="chev"><Icon name="chev" size={16} /></span></div>
  <div class="section-sub">{c.blurb} · {list.filter((a) => a.available).length} available, {list.filter((a) => !a.available).length} planned</div>
  <div class="grid">
    {#each list as a}
      <Row title={a.name} sub={a.available ? a.subtitle : `${a.subtitle} · planned`} onclick={() => (store.detail = a.id)}>
        {#snippet icon()}<AppIcon app={a} size={64} />{/snippet}
        {#snippet action()}<AppAction app={a} />{/snippet}
      </Row>
    {/each}
  </div>
{/each}

<p class="note muted">Only Squeeze is ready today. The other apps are planned and will appear here, each in its own category, when they ship.</p>

<style>
  .seg {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    flex-wrap: wrap;
  }
  .seg button {
    height: 30px;
    padding: 0 14px;
    border-radius: 9px;
    font-size: 13.5px;
    color: var(--text-2);
  }
  .seg button.on {
    background: rgba(255, 255, 255, 0.16);
    color: var(--text);
    font-weight: 600;
    box-shadow: var(--sheen);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 36px;
  }
  .note {
    margin-top: 30px;
    font-size: 13px;
  }
</style>
