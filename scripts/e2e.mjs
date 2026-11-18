// E2E for the Creative Creator Studio launcher. Drives the real app over WebView2 CDP.
// Usage: node launcher/scripts/e2e.mjs <launcher.exe> [screenshot-dir]
// Side effects: one source .zip in Downloads (deleted at the end); the installer is downloaded and
// hash-checked but NOT run (CS_LAUNCHER_DRY_INSTALL).
import { spawn } from "node:child_process";
import { mkdtempSync, existsSync, mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exe = process.argv[2];
const shots = process.argv[3] ?? join(tmpdir(), "launcher-shots");
if (!exe || !existsSync(exe)) throw new Error("usage: node e2e.mjs <launcher.exe> [shots]");
mkdirSync(shots, { recursive: true });
const PORT = 9360, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d = "") => { results.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  - " + String(d).slice(0, 300) : ""}`); };

// Fake Squeeze data: one saved preset "AOp" and one finished export.
const work = mkdtempSync(join(tmpdir(), "cs-launcher-"));
const out = join(work, "holiday-h264.mp4");
writeFileSync(out, Buffer.alloc(2_500_000, 1));
writeFileSync(join(work, "presets.json"), JSON.stringify([{ id: "custom-aop", name: "AOp", group: "Custom", container: "mp4", video: { codec: "h264" }, audio: { codec: "aac" } }]));
writeFileSync(join(work, "queue.json"), JSON.stringify({ version: 1, next_id: 3, jobs: [{ id: 1, state: "done", output: out, preset: { name: "H.264 MP4 — 1080p" } }, { id: 2, state: "failed", output: join(work, "nope.mp4"), preset: { name: "x" } }] }));

const app = spawn(exe, [], { env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}`, CS_LAUNCHER_SQUEEZE_DATA: work, CS_LAUNCHER_DRY_INSTALL: "1", CS_LAUNCHER_FORCE_NOT_INSTALLED: "1" }, stdio: "ignore" });
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => {
  const r = await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails).slice(0, 300));
  return r.result?.result?.value;
};
const inv = (c, a = {}) => ev(`window.__TAURI_INTERNALS__.invoke(${JSON.stringify(c)}, ${JSON.stringify(a)}).then(v=>({ok:true,v}),e=>({ok:false,e:String(e)}))`);
const text = () => ev("document.querySelector('main')?.innerText ?? ''");
const shot = async (n) => writeFileSync(join(shots, n), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
const click = (sel, txt) => ev(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().includes(${JSON.stringify(txt)})); if(!el) return false; el.click(); return true })()`);
const waitFor = async (fn, ms = 30000, step = 200) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(step); } return false; };
const nav = async (name) => { await click("aside nav .nav", name); await sleep(500); };
let zip = "";

try {
  for (let i = 0; i < 80 && !ws; i++) { try { const p = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); ws.onmessage = (m) => { const d = JSON.parse(m.data); pend.get(d.id)?.(d); }; } } catch {} if (!ws) await sleep(500); }
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const gh = await (await fetch("https://api.github.com/repos/plawanpawin-byte/squzze", { headers: { "User-Agent": "e2e" } })).json();
  const ghRel = await (await fetch("https://api.github.com/repos/plawanpawin-byte/squzze/releases", { headers: { "User-Agent": "e2e" } })).json();
  await waitFor(async () => /Squeeze 0\./.test(await text()), 30000);
  await sleep(800);

  // ---- shell ----
  const navs = await ev(`[...document.querySelectorAll('aside nav .nav')].map(n=>n.innerText.trim()).join('|')`);
  check("sidebar: Home | Apps | News | Files | Source", navs === "Home|Apps|News|Files|Source", navs);
  check("Home is selected first", (await ev(`document.querySelector('aside .nav.on')?.innerText.trim()`)) === "Home");
  const blur = await ev(`getComputedStyle(document.querySelector('aside.sidebar')).backdropFilter`);
  check("sidebar is liquid glass (backdrop blur)", /blur/.test(blur), blur);
  check("page background is transparent (window acrylic shows through)", (await ev(`getComputedStyle(document.body).backgroundColor`)) === "rgba(0, 0, 0, 0)");

  // ---- Home ----
  const t0 = await text();
  const latest = ghRel.filter((r) => !r.draft)[0];
  check("hero shows the latest release from GitHub", t0.includes(latest.tag_name.replace(/^v/, "").replace(/-beta$/, "")), latest.tag_name);
  check("Recent updates has 4 cards with pictures", (await ev(`document.querySelectorAll('.cards .card').length`)) === 4 && (await ev(`[...document.querySelectorAll('.cards img')].every(i=>i.complete&&i.naturalWidth>0)`)));
  check("Home lists suite apps", /Squeeze/.test(t0) && /Apps in the suite/.test(t0));
  check("Home shows the live star count", (await ev(`document.querySelector('.stats .stat b')?.innerText`)) === String(gh.stargazers_count), gh.stargazers_count);
  await shot("1-home.png");

  // ---- Apps ----
  await nav("Apps");
  const heads = await ev(`[...document.querySelectorAll('main .section-head h2')].map(h=>h.innerText).join('|')`);
  check("Apps grouped by purpose", heads === "Video & Motion|Music & Audio|Photo & Design|Documents & Ideas", heads);
  check("10 apps listed; only Squeeze can be installed", (await ev(`document.querySelectorAll('main .row').length`)) === 10 && (await ev(`[...document.querySelectorAll('main .row .pill')].filter(b=>!b.disabled).length`)) === 1);
  await shot("2-apps.png");
  await click("main .seg button", "Music"); await sleep(300);
  check("category filter works", (await ev(`document.querySelectorAll('main .row').length`)) === 2);
  await click("main .seg button", "All");

  // ---- App detail + dry-run install ----
  await click("main .row .main", "Squeeze"); await sleep(500);
  check("detail sheet opens", !!(await ev(`document.querySelector('[role=dialog]')?.innerText.includes('GPL-3.0')`)));
  await shot("3-detail.png");
  await click("[role=dialog] .pill", "Get");
  const installMsg = await waitFor(async () => { const t = await ev(`document.querySelector('.toast')?.innerText ?? ''`); return /SHA-256|failed/.test(t) ? t : false; }, 120000);
  check("Get downloads the installer and its SHA-256 matches (dry run)", /SHA-256 matched/.test(installMsg), installMsg);
  await ev(`document.querySelector('[role=dialog] .x').click()`);

  // ---- News ----
  await nav("News");
  await waitFor(async () => (await ev(`document.querySelectorAll('.post').length`)) > 0, 10000);
  check("News: star count equals GitHub", (await ev(`document.querySelector('[aria-label="GitHub stars"]').innerText`)) === gh.stargazers_count.toLocaleString("en-US"), gh.stargazers_count);
  check("News: one post per release", (await ev(`document.querySelectorAll('.post').length`)) === ghRel.filter((r) => !r.draft).length);
  check("News: release notes rendered, no raw HTML injected", (await ev(`document.querySelectorAll('.post .body script, .post .body img').length`)) === 0 && (await ev(`document.querySelector('.post .body').innerText.length`)) > 20);
  await shot("4-news.png");

  // ---- Files ----
  await nav("Files");
  await waitFor(async () => /AOp/.test(await text()), 10000);
  const ft = await text();
  check("Files: saved Squeeze preset 'AOp' shows", /AOp/.test(ft) && /Preset · MP4 H264/.test(ft), "");
  check("Files: finished export shows, failed one does not", /holiday-h264\.mp4/.test(ft) && !/nope\.mp4/.test(ft));
  await shot("5-files.png");
  await click("main .seg button", "Presets"); await sleep(200);
  check("Files: type filter", (await ev(`document.querySelectorAll('main .row').length`)) === 1);
  await click("main .seg button", "All");
  check("reveal refuses files the launcher did not list", !(await inv("reveal", { path: "C:\\Windows\\System32\\drivers\\etc\\hosts" })).ok);
  check("open_url refuses other sites", !(await inv("open_url", { url: "https://example.com" })).ok);

  // ---- Source ----
  await nav("Source");
  check("Source: per-app grid with Get buttons", (await ev(`document.querySelectorAll('main .row').length`)) === 10);
  await shot("6-source.png");
  await click("main .row .main", "Squeeze"); await sleep(400);
  const st = await text();
  check("Source detail: clone command and all versions", /git clone https:\/\/github.com\/plawanpawin-byte\/squzze\.git/.test(st) && ghRel.every((r) => st.includes(r.tag_name)));
  await shot("7-source-detail.png");
  const oldest = ghRel.at(-1).tag_name;
  await ev(`(() => { const v=[...document.querySelectorAll('.ver')].find(v=>v.innerText.includes(${JSON.stringify(oldest)})); v.querySelector('.pill').click(); return true })()`);
  const dlMsg = await waitFor(async () => { const t = await ev(`document.querySelector('.toast')?.innerText ?? ''`); return /Saved|failed/.test(t) ? t : false; }, 120000);
  const dl = join(process.env.USERPROFILE, "Downloads");
  zip = (dlMsg.match(/Saved (\S+\.zip)/) ?? [])[1] ? join(dl, dlMsg.match(/Saved (\S+\.zip)/)[1]) : "";
  check("Download source code saves a zip of that version", zip && existsSync(zip) && statSync(zip).size > 10000, dlMsg);

  // ---- Search ----
  await ev(`(() => { const i=document.querySelector('[aria-label=Search]'); i.value='aop'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`); await sleep(300);
  check("Search finds the saved preset", /AOp/.test(await text()) && (await ev(`document.querySelector('header h1').innerText`)) === "Search");
  await shot("8-search.png");
} catch (e) {
  check("script completed without exception", false, e);
} finally {
  try { app.kill(); } catch {}
  try { if (zip) rmSync(zip); } catch {}
  try { rmSync(work, { recursive: true, force: true }); } catch {}
  const ok = results.filter(Boolean).length;
  console.log(`${ok}/${results.length} checks passed`);
  process.exit(ok === results.length ? 0 : 1);
}
