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
  <div class="art" aria-hidden="true">
    <div class="lines"></div>
    <div class="shot back"><img src={sq.shots?.[2]?.src} alt="" /></div>
    <div class="shot"><img src={sq.shots?.[0]?.src} alt="" /></div>
    <img class="bigicon" src={sq.icon.img} alt="" />
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
    /* matte charcoal into the warm amber of the Squeeze icon */
    background: linear-gradient(112deg, #0c0e13 0%, #14151a 34%, #33281a 66%, #5e431e 100%);
    container-type: inline-size;
  }
  .art {
    position: absolute;
    inset: 0;
    perspective: 1500px;
  }
  /* faint blueprint grid, fading in from the left */
  .lines {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: linear-gradient(90deg, transparent 28%, #000 75%);
    mask-image: linear-gradient(90deg, transparent 28%, #000 75%);
  }
  /* the app window, tilted and running off the edge */
  .shot {
    position: absolute;
    right: -70px;
    top: 48px;
    width: 60%;
    aspect-ratio: 16 / 10;
    border-radius: 14px;
    overflow: hidden;
    background: #111318;
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 34px 70px rgba(0, 0, 0, 0.55), 0 10px 22px rgba(0, 0, 0, 0.35);
    transform: rotateY(-16deg) rotateX(5deg) rotateZ(1deg);
    transform-origin: 100% 50%;
  }
  /* a second window behind, for depth */
  .shot.back {
    top: 16px;
    right: 150px;
    width: 46%;
    opacity: 0.5;
    filter: saturate(0.7) brightness(0.8);
    transform: rotateY(-16deg) rotateX(5deg) rotateZ(1deg);
  }
  .shot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top left;
    display: block;
  }
  .shot::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.1), transparent 35%);
    pointer-events: none;
  }
  .bigicon {
    position: absolute;
    width: 128px;
    height: 128px;
    right: calc(60% - 120px);
    bottom: 30px;
    filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.55));
  }
  @container (max-width: 860px) {
    .bigicon {
      display: none;
    }
    .shot {
      width: 54%;
    }
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
    background: linear-gradient(90deg, rgba(12, 14, 19, 0.92), rgba(12, 14, 19, 0.6) 70%, rgba(12, 14, 19, 0));
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
