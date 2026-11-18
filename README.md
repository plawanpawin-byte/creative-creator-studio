# Creative Creator Studio launcher

A small Windows app to install, open and follow the suite's free apps. Liquid-glass look (window acrylic + translucent panels), styled after the Apple Developer app and the App Store grid.

| Page | What it shows |
|---|---|
| Home | Featured banner for the latest release, recent pictures from the apps, the app list, live GitHub numbers |
| Apps | Every app, grouped by purpose (Video & Motion, Music & Audio, Photo & Design, Documents & Ideas). Only **Squeeze** exists today; the rest say *planned* |
| News | GitHub stars, forks, watchers, issues and every release note for our own apps (cached for offline use) |
| Files | Things you saved in installed apps: Squeeze custom presets (e.g. "AOp") and finished exports, grouped per app |
| Source | Per-app source code: download a `.zip` of `main` or any release into Downloads, or copy the `git clone` command |

**Get** downloads `Squeeze_*_x64-setup.exe` from the latest GitHub release, checks it against the release's `SHA256.txt`, and only then runs it silently (per-user install, no admin). A mismatch deletes the file.

## Build

```bash
cd launcher
npm install
npx tauri build
```

The Rust crate is its own Cargo workspace, so it builds apart from the app crates.

## Test

```bash
node launcher/scripts/e2e.mjs <path-to>/creator-suite-launcher.exe <screenshot-dir>
```

The E2E uses fake Squeeze data (`CS_LAUNCHER_SQUEEZE_DATA`), downloads and hash-checks the installer without running it (`CS_LAUNCHER_DRY_INSTALL`), and deletes the source zip it saves to Downloads. `scripts/real-shots.mjs` captures the real on-screen window (needs an unlocked desktop).
