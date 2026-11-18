// Opens the launcher on screen and captures each page as the user sees it (with the acrylic glass).
// Usage: node launcher/scripts/real-shots.mjs <launcher.exe> <out-dir>
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const [exe, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const PORT = 9361, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = spawn(exe, [], { env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}` }, stdio: "ignore" });
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
const cap = (name) => console.log(execFileSync("powershell", ["-NoProfile", "-File", join(dirname(fileURLToPath(import.meta.url)), "capture-window.ps1"), basename(exe, ".exe"), join(outDir, name)]).toString().trim());
try {
  for (let i = 0; i < 80 && !ws; i++) { try { const p = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); ws.onmessage = (m) => { const d = JSON.parse(m.data); pend.get(d.id)?.(d); }; } } catch {} if (!ws) await sleep(500); }
  await sleep(4000);
  for (const [i, page] of ["Home", "Apps", "News", "Files", "Source"].entries()) {
    await ev(`[...document.querySelectorAll('aside nav .nav')].find(n=>n.innerText.trim()===${JSON.stringify(page)})?.click()`);
    await sleep(900);
    cap(`real-${i + 1}-${page.toLowerCase()}.png`);
  }
  await ev(`document.querySelector('main .row .main')?.click()`);
  await sleep(700);
  cap("real-6-detail.png");
} finally {
  app.kill();
}
