<script lang="ts">
  // One cell of the App Store-style grid: icon, two lines of text, action on the right.
  import type { Snippet } from "svelte";
  let { icon, title, sub, action, onclick, label }: { icon: Snippet; title: string; sub: string; action?: Snippet; onclick?: () => void; label?: string } = $props();
</script>

<div class="row">
  <button class="main" {onclick} disabled={!onclick} aria-label={label ?? title}>
    {@render icon()}
    <span class="txt">
      <b>{title}</b>
      <small>{sub}</small>
    </span>
  </button>
  {#if action}<div class="act">{@render action()}</div>{/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 12px 0;
    border-bottom: 1px solid var(--stroke-soft);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    text-align: left;
    cursor: pointer;
  }
  .main:disabled {
    cursor: default;
  }
  .txt {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  b {
    font-size: 15px;
    font-weight: 650;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  small {
    font-size: 13px;
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .act {
    flex: none;
  }
</style>
