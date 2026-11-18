import { api, type GithubInfo, type Installed, type Progress, type SavedFile } from "./api";

export type Page = "home" | "apps" | "news" | "files" | "source";
export const PAGES: { id: Page; name: string; icon: string }[] = [
  { id: "home", name: "Home", icon: "home" },
  { id: "apps", name: "Apps", icon: "apps" },
  { id: "news", name: "News", icon: "news" },
  { id: "files", name: "Files", icon: "files" },
  { id: "source", name: "Source", icon: "source" },
];

class Store {
  page = $state<Page>("home");
  back = $state<Page[]>([]);
  fwd = $state<Page[]>([]);
  search = $state("");
  detail = $state<string | null>(null);

  gh = $state<GithubInfo | null>(null);
  ghError = $state("");
  ghLoading = $state(false);
  installed = $state<Record<string, Installed>>({});
  files = $state<SavedFile[]>([]);
  filesLoaded = $state(false);
  progress = $state<Record<string, Progress>>({});
  busy = $state<Record<string, boolean>>({});
  toast = $state<{ text: string; bad: boolean; path?: string } | null>(null);
  version = $state("");

  go(p: Page) {
    if (p === this.page) return;
    this.back = [...this.back, this.page];
    this.fwd = [];
    this.page = p;
    this.detail = null;
  }
  goBack() {
    const p = this.back.at(-1);
    if (!p) return;
    this.fwd = [this.page, ...this.fwd];
    this.back = this.back.slice(0, -1);
    this.page = p;
  }
  goFwd() {
    const p = this.fwd[0];
    if (!p) return;
    this.back = [...this.back, this.page];
    this.fwd = this.fwd.slice(1);
    this.page = p;
  }

  say(text: string, bad = false, path?: string) {
    this.toast = { text, bad, path };
    const t = this.toast;
    setTimeout(() => this.toast === t && (this.toast = null), bad ? 9000 : 6000);
  }

  async init() {
    api.onProgress((p) => (this.progress = { ...this.progress, [p.task]: p }));
    api.about().then((a) => (this.version = a.version)).catch(() => {});
    await Promise.all([this.loadInstalled(), this.loadGithub(false), this.loadFiles()]);
  }
  async loadGithub(force: boolean) {
    this.ghLoading = true;
    try {
      this.gh = await api.github(force);
      this.ghError = this.gh.stale ? (this.gh.error ?? "offline") : "";
    } catch (e) {
      this.ghError = String(e);
    } finally {
      this.ghLoading = false;
    }
  }
  async loadInstalled() {
    try {
      const list = await api.installed();
      this.installed = Object.fromEntries(list.map((i) => [i.id, i]));
    } catch {}
  }
  async loadFiles() {
    try {
      this.files = await api.files();
    } catch {}
    this.filesLoaded = true;
  }

  async install(id: string) {
    const task = `install:${id}`;
    if (this.busy[task]) return;
    this.busy = { ...this.busy, [task]: true };
    try {
      const r = await api.install(id);
      this.installed = { ...this.installed, [id]: r.installed };
      this.say(r.ran_installer ? `Squeeze ${r.version} installed. SHA-256 checked.` : `Squeeze ${r.version} downloaded and its SHA-256 matched (test mode: installer not started).`);
    } catch (e) {
      this.say(`Install failed: ${e}`, true);
    } finally {
      this.busy = { ...this.busy, [task]: false };
      const { [task]: _, ...rest } = this.progress;
      this.progress = rest;
    }
  }
  async launch(id: string) {
    try {
      await api.launch(id);
      this.say("Opening Squeeze…");
    } catch (e) {
      this.say(String(e), true);
    }
  }
  async downloadSource(id: string, tag: string | null) {
    const task = `source:${id}:${tag ?? "main"}`;
    if (this.busy[task]) return;
    this.busy = { ...this.busy, [task]: true };
    try {
      const path = await api.downloadSource(id, tag);
      this.say(`Saved ${path.split(/[\\/]/).pop()} to Downloads`, false, path);
    } catch (e) {
      this.say(`Download failed: ${e}`, true);
    } finally {
      this.busy = { ...this.busy, [task]: false };
      const { [task]: _, ...rest } = this.progress;
      this.progress = rest;
    }
  }
  latest() {
    return this.gh?.releases[0] ?? null;
  }
}

export const store = new Store();

export const fmtSize = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} KB` : `${b} B`);
export const fmtDate = (s: string | number) => {
  const d = new Date(s);
  return isNaN(+d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
export const ago = (s: string | number) => {
  const t = +new Date(s);
  if (!t) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
};
