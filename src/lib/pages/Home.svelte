<script lang="ts">
  import Icon from "../Icon.svelte";
  import AppIcon from "../AppIcon.svelte";
  import AppAction from "../AppAction.svelte";
  import Row from "../Row.svelte";
  import { store, fmtDate } from "../store.svelte";
  import { APPS, appById } from "../catalog";
  import { api } from "../api";

  const sq = appById("squeeze")!;
  const rel = $derived(store.latest());
  const ver = $derived(rel ? rel.tag.replace(/^v/, "").replace(/-beta$/, "") : "");
  const lead = $derived.by(() => {
    const line = (rel?.body ?? "").split(/\r?\n/).map((l) => l.replace(/^[#>*\-\s]+/, "").replace(/\*\*/g, "").trim()).find((l) => l.length > 30);
    return line ?? sq.description;
  });
  const updates = $derived([
    ...(sq.shots ?? []).map((s) => ({ img: s.src, title: `Squeeze · ${s.title}`, text: s.text, go: () => (store.detail = "squeeze") })),
    ...(rel ? [{ img: "", title: rel.name || rel.tag, text: `Released ${fmtDate(rel.published_at)}`, go: () => store.go("news") }] : []),
  ]);
</script>

<!-- Featured banner -->
<section class="hero">
  <div class="space" aria-hidden="true">
    <div class="stars"></div>
    <div class="planet"></div>
    <div class="word">squeeze{ver ? ` ${ver}` : ""}</div>
  </div>
  <div class="caption">
    <div class="eyebrow">{rel ? `NEW RELEASE · ${fmtDate(rel.published_at).toUpperCase()}` : "CREATOR SUITE"}</div>
    <h2>{rel ? `Squeeze ${ver}` : "Hello, creator"}</h2>
    <p>{lead}</p>
    <div class="btns">
      <AppAction app={sq} big />
      {#if rel}<button class="pill" onclick={() => store.go("news")}>What's new</button>{/if}
    </div>
  </div>
</section>

<div class="section-head"><h2>Recent updates</h2><span class="chev"><Icon name="chev" size={16} /></span></div>
<div class="section-sub">Pictures and notes from the apps</div>
<div class="cards">
  {#each updates as u}
    <button class="card" onclick={u.go}>
      <div class="thumb glass">
        {#if u.img}<img src={u.img} alt="" />{:else}<div class="relart"><Icon name="tag" size={34} /><span>{rel?.tag}</span></div>{/if}
      </div>
      <b>{u.title}</b>
      <small>{u.text}</small>
    </button>
  {/each}
</div>

<div class="section-head"><h2>Apps in the suite</h2><button class="chev" onclick={() => store.go("apps")} aria-label="All apps"><Icon name="chev" size={16} /></button></div>
<div class="section-sub">One free, open-source app for each job</div>
<div class="grid">
  {#each APPS.slice(0, 8) as a}
    <Row title={a.name} sub={a.available ? a.subtitle : `${a.subtitle} · planned`} onclick={() => (store.detail = a.id)}>
      {#snippet icon()}<AppIcon app={a} size={60} />{/snippet}
      {#snippet action()}<AppAction app={a} />{/snippet}
    </Row>
  {/each}
</div>

<div class="section-head"><h2>On GitHub</h2><button class="chev" onclick={() => store.go("news")} aria-label="News"><Icon name="chev" size={16} /></button></div>
<div class="section-sub">Live numbers for the project</div>
<div class="stats">
  <div class="stat glass"><span class="ic y"><Icon name="star" size={18} fill /></span><b>{store.gh?.repo.stars ?? "—"}</b><small>Stars</small></div>
  <div class="stat glass"><span class="ic"><Icon name="fork" size={18} /></span><b>{store.gh?.repo.forks ?? "—"}</b><small>Forks</small></div>
  <div class="stat glass"><span class="ic"><Icon name="tag" size={18} /></span><b>{store.gh?.releases.length ?? "—"}</b><small>Releases</small></div>
  <button class="stat glass link" onclick={() => api.openUrl(store.gh?.repo.html_url || "https://github.com/plawanpawin-byte/squzze")}><span class="ic"><Icon name="external" size={18} /></span><b>Open</b><small>github.com</small></button>
</div>

<style>
  .hero {
    position: relative;
    height: 360px;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid var(--stroke);
    box-shadow: var(--sheen), 0 20px 50px rgba(0, 0, 0, 0.35);
    background: #03050c;
  }
  .space {
    position: absolute;
    inset: 0;
  }
  .stars {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(1px 1px at 12% 22%, #fff8, transparent), radial-gradient(1px 1px at 32% 68%, #fff6, transparent), radial-gradient(1.4px 1.4px at 58% 18%, #fffa, transparent), radial-gradient(1px 1px at 76% 42%, #fff7, transparent),
      radial-gradient(1px 1px at 88% 12%, #fff9, transparent), radial-gradient(1.2px 1.2px at 46% 40%, #fff5, transparent), radial-gradient(1px 1px at 22% 84%, #fff6, transparent), radial-gradient(1px 1px at 94% 74%, #fff5, transparent);
  }
  /* quiet planet horizon, bottom right (no glow) */
  .planet {
    position: absolute;
    width: 1100px;
    height: 1100px;
    border-radius: 50%;
    right: -330px;
    top: 210px;
    background: radial-gradient(circle at 50% 8%, #2b3a55 0%, #161e2e 24%, #0a0e17 50%, #05070c 72%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }
  .word {
    position: absolute;
    right: 7%;
    top: 22%;
    font-family: "Cascadia Mono", "Consolas", ui-monospace, monospace;
    font-size: clamp(44px, 6.4vw, 96px);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #fff;
    white-space: nowrap;
  }
  .caption {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(420px, 46%);
    padding: 30px 30px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
    background: linear-gradient(90deg, rgba(3, 5, 12, 0.85), rgba(3, 5, 12, 0.5) 70%, rgba(3, 5, 12, 0));
  }
  .eyebrow {
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }
  .caption h2 {
    font-size: 30px;
    font-weight: 750;
    letter-spacing: -0.02em;
  }
  .caption p {
    font-size: 14.5px;
    line-height: 1.45;
    color: var(--text-2);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .btns {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
  .card {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .thumb {
    aspect-ratio: 16 / 10;
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 6px;
    transition: transform 0.15s;
  }
  .card:hover .thumb {
    transform: translateY(-2px);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top left;
    display: block;
  }
  .relart {
    height: 100%;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 8px;
    background: linear-gradient(145deg, #2a3342, #1a202b);
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 17px;
  }
  .card b {
    font-size: 14.5px;
    font-weight: 650;
  }
  .card small {
    font-size: 13px;
    color: var(--text-2);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 36px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .stat {
    border-radius: 16px;
    padding: 16px 18px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: 12px;
    align-items: center;
    text-align: left;
  }
  .stat .ic {
    grid-row: span 2;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.08);
    color: var(--accent-text);
  }
  .stat .ic.y {
    color: #ffd60a;
  }
  .stat b {
    font-size: 21px;
    font-weight: 700;
  }
  .stat small {
    color: var(--text-2);
    font-size: 12.5px;
  }
  .link:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
