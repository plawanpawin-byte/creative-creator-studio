// Clicks Get in the real launcher (no test env vars) and waits for the per-user install to finish.
// Usage: node launcher/scripts/real-install.mjs <launcher.exe>
import { spawn, execFileSync } from "node:child_process";
const [exe] = process.argv.slice(2);
const PORT = 9362, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const env = { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}` };
delete env.CS_LAUNCHER_DRY_INSTALL; delete env.CS_LAUNCHER_SQUEEZE_DATA; delete env.CS_LAUNCHER_SQUEEZE_EXE;
const app = spawn(exe, [], { env, stdio: "ignore" });
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
try {
  for (let i = 0; i < 80 && !ws; i++) { try { const p = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); ws.onmessage = (m) => { const d = JSON.parse(m.data); pend.get(d.id)?.(d); }; } } catch {} if (!ws) await sleep(500); }
  await sleep(4000);
  const reg = () => { try { const o = execFileSync("reg", ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", "/s", "/f", "Squeeze", "/d"]).toString(); const v = /DisplayVersion\s+REG_SZ\s+(\S+)/.exec(o), l = /InstallLocation\s+REG_SZ\s+(.+)/.exec(o); return v ? `${v[1]} @ ${l ? l[1].trim() : "?"}` : ""; } catch { return ""; } };
  console.log("before:", reg() || "not installed");
  console.log("click Get:", await ev(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Get'); b?.click(); return b?'clicked':'no Get button (already installed?)'})()`));
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const r = reg();
    if (i % 3 === 0) console.log(`t=${i * 3}s`, r || "-", await ev(`document.querySelector('.toast')?.innerText ?? ''`));
    if (r) { console.log("after:", r); break; }
  }
  await sleep(2500);
  console.log("button now:", await ev(`[...document.querySelectorAll('main .pill')].slice(0,2).map(b=>b.innerText.trim()).join(' | ')`));
} finally { app.kill(); }
