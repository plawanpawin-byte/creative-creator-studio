<script lang="ts">
  import type { AppEntry } from "./catalog";
  import Icon from "./Icon.svelte";
  let { app, size = 64 }: { app: AppEntry; size?: number } = $props();
</script>

<div class="appicon" class:planned={!app.available} style="width:{size}px;height:{size}px;border-radius:{size * 0.235}px;--from:{app.icon.from};--to:{app.icon.to}">
  {#if app.icon.img}
    <img src={app.icon.img} alt="" />
  {:else}
    <span style="color:#fff"><Icon name={app.icon.glyph ?? "apps"} size={size * 0.5} /></span>
  {/if}
</div>

<style>
  .appicon {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: linear-gradient(145deg, var(--from), var(--to));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(0, 0, 0, 0.2), 0 6px 18px rgba(0, 0, 0, 0.35);
  }
  /* glass sheen */
  .appicon::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 46%);
    pointer-events: none;
  }
  .appicon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .planned {
    filter: saturate(0.75);
  }
</style>
