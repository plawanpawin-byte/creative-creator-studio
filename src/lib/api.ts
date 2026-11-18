import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type Repo = { stars: number; forks: number; watchers: number; open_issues: number; pushed_at: string; html_url: string; description: string; license: string };
export type Asset = { name: string; size: number; url: string };
export type Release = { tag: string; name: string; published_at: string; body: string; prerelease: boolean; html_url: string; assets: Asset[] };
export type GithubInfo = { repo: Repo; releases: Release[]; fetched_at: number; stale: boolean; error: string | null };
export type Installed = { id: string; installed: boolean; version: string; exe: string };
export type InstallResult = { version: string; sha256: string; ran_installer: boolean; installed: Installed };
export type SavedFile = { app: string; kind: "preset" | "video" | "audio"; name: string; detail: string; path: string; size: number; modified: number };
export type Progress = { task: string; phase: string; done: number; total: number };

export const api = {
  github: (force = false) => invoke<GithubInfo>("github_info", { force }),
  installed: () => invoke<Installed[]>("installed_apps"),
  launch: (id: string) => invoke<void>("launch_app", { id }),
  install: (id: string) => invoke<InstallResult>("install_app", { id }),
  downloadSource: (id: string, tag: string | null) => invoke<string>("download_source", { id, tag }),
  files: () => invoke<SavedFile[]>("app_files"),
  reveal: (path: string) => invoke<void>("reveal", { path }),
  openFile: (path: string) => invoke<void>("open_file", { path }),
  openUrl: (url: string) => invoke<void>("open_url", { url }),
  about: () => invoke<{ version: string; repo: string }>("about"),
  onProgress: (f: (p: Progress) => void): Promise<UnlistenFn> => listen<Progress>("progress", (e) => f(e.payload)),
};
