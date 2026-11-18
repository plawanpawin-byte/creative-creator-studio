//! Creative Creator Studio launcher backend: GitHub news, install/open apps, saved files, source downloads.
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, State};

const REPO: &str = "plawanpawin-byte/squzze";
const UA: &str = "CreatorSuite-Launcher";
const CACHE_TTL_MS: u64 = 10 * 60 * 1000;

struct AppState {
    data: PathBuf,
    /// Files the UI may open or reveal (from listings and downloads); nothing else.
    known: Mutex<Vec<PathBuf>>,
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn mtime_ms(p: &Path) -> u64 {
    fs::metadata(p).and_then(|m| m.modified()).ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok()).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn client(timeout: Option<Duration>) -> Result<reqwest::blocking::Client, String> {
    let mut b = reqwest::blocking::Client::builder().user_agent(UA).connect_timeout(Duration::from_secs(15));
    if let Some(t) = timeout {
        b = b.timeout(t);
    }
    b.build().map_err(|e| e.to_string())
}

fn get_json(url: &str) -> Result<Value, String> {
    let r = client(Some(Duration::from_secs(30)))?
        .get(url)
        .header("Accept", "application/vnd.github+json")
        .send()
        .map_err(|e| format!("network: {e}"))?;
    let status = r.status();
    if !status.is_success() {
        return Err(format!("GitHub answered {status}"));
    }
    r.json::<Value>().map_err(|e| e.to_string())
}

// ---------------------------------------------------------------- GitHub

#[derive(Serialize, serde::Deserialize, Clone)]
struct Repo {
    stars: u64,
    forks: u64,
    watchers: u64,
    open_issues: u64,
    pushed_at: String,
    html_url: String,
    description: String,
    license: String,
}

#[derive(Serialize, serde::Deserialize, Clone)]
struct Asset {
    name: String,
    size: u64,
    url: String,
}

#[derive(Serialize, serde::Deserialize, Clone)]
struct Release {
    tag: String,
    name: String,
    published_at: String,
    body: String,
    prerelease: bool,
    html_url: String,
    assets: Vec<Asset>,
}

#[derive(Serialize, serde::Deserialize, Clone)]
struct GithubInfo {
    repo: Repo,
    releases: Vec<Release>,
    fetched_at: u64,
    #[serde(default)]
    stale: bool,
    #[serde(default)]
    error: Option<String>,
}

fn s(v: &Value, k: &str) -> String {
    v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string()
}
fn n(v: &Value, k: &str) -> u64 {
    v.get(k).and_then(|x| x.as_u64()).unwrap_or(0)
}

fn fetch_github() -> Result<GithubInfo, String> {
    let r = get_json(&format!("https://api.github.com/repos/{REPO}"))?;
    let repo = Repo {
        stars: n(&r, "stargazers_count"),
        forks: n(&r, "forks_count"),
        watchers: n(&r, "subscribers_count"),
        open_issues: n(&r, "open_issues_count"),
        pushed_at: s(&r, "pushed_at"),
        html_url: s(&r, "html_url"),
        description: s(&r, "description"),
        license: r.get("license").map(|l| s(l, "spdx_id")).unwrap_or_default(),
    };
    let rel = get_json(&format!("https://api.github.com/repos/{REPO}/releases?per_page=20"))?;
    let releases = rel
        .as_array()
        .map(|a| {
            a.iter()
                .filter(|x| !x.get("draft").and_then(|d| d.as_bool()).unwrap_or(false))
                .map(|x| Release {
                    tag: s(x, "tag_name"),
                    name: s(x, "name"),
                    published_at: s(x, "published_at"),
                    body: s(x, "body").chars().take(20_000).collect(),
                    prerelease: x.get("prerelease").and_then(|d| d.as_bool()).unwrap_or(false),
                    html_url: s(x, "html_url"),
                    assets: x
                        .get("assets")
                        .and_then(|a| a.as_array())
                        .map(|a| a.iter().map(|y| Asset { name: s(y, "name"), size: n(y, "size"), url: s(y, "browser_download_url") }).collect())
                        .unwrap_or_default(),
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(GithubInfo { repo, releases, fetched_at: now_ms(), stale: false, error: None })
}

#[tauri::command]
async fn github_info(state: State<'_, AppState>, force: bool) -> Result<GithubInfo, String> {
    let cache = state.data.join("github-cache.json");
    let cached: Option<GithubInfo> = fs::read(&cache).ok().and_then(|b| serde_json::from_slice(&b).ok());
    if let Some(c) = &cached {
        if !force && now_ms().saturating_sub(c.fetched_at) < CACHE_TTL_MS {
            return Ok(c.clone());
        }
    }
    match tauri::async_runtime::spawn_blocking(fetch_github).await.map_err(|e| e.to_string())? {
        Ok(info) => {
            if let Ok(b) = serde_json::to_vec_pretty(&info) {
                let _ = fs::write(&cache, b);
            }
            Ok(info)
        }
        Err(e) => match cached {
            Some(mut c) => {
                c.stale = true;
                c.error = Some(e);
                Ok(c)
            }
            None => Err(e),
        },
    }
}

// ---------------------------------------------------------------- installed apps

#[derive(Serialize, Clone)]
struct Installed {
    id: String,
    installed: bool,
    version: String,
    exe: String,
}

#[cfg(windows)]
fn registry_app(display_name: &str) -> Option<(String, PathBuf)> {
    use winreg::{enums::*, RegKey};
    for hive in [HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE] {
        let root = RegKey::predef(hive);
        let Ok(un) = root.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall") else { continue };
        for name in un.enum_keys().flatten() {
            let Ok(k) = un.open_subkey(&name) else { continue };
            let dn: String = k.get_value("DisplayName").unwrap_or_default();
            if dn != display_name {
                continue;
            }
            let ver: String = k.get_value("DisplayVersion").unwrap_or_default();
            let loc: String = k.get_value("InstallLocation").unwrap_or_default();
            let icon: String = k.get_value("DisplayIcon").unwrap_or_default();
            let mut exe = PathBuf::from(loc.trim_matches('"')).join("squeeze.exe");
            if !exe.is_file() {
                exe = PathBuf::from(icon.split(',').next().unwrap_or("").trim_matches('"'));
            }
            if exe.is_file() {
                return Some((ver, exe));
            }
        }
    }
    None
}
#[cfg(not(windows))]
fn registry_app(_: &str) -> Option<(String, PathBuf)> {
    None
}

fn detect_squeeze() -> Installed {
    // Test/dev override: point the launcher at a local build.
    if let Ok(p) = std::env::var("CS_LAUNCHER_SQUEEZE_EXE") {
        if Path::new(&p).is_file() {
            return Installed { id: "squeeze".into(), installed: true, version: "dev".into(), exe: p };
        }
    }
    // Test override: behave as if nothing is installed, whatever this PC has.
    let registry = if std::env::var("CS_LAUNCHER_FORCE_NOT_INSTALLED").is_ok() { None } else { registry_app("Squeeze") };
    match registry {
        Some((version, exe)) => Installed { id: "squeeze".into(), installed: true, version, exe: exe.to_string_lossy().into() },
        None => Installed { id: "squeeze".into(), installed: false, version: String::new(), exe: String::new() },
    }
}

#[tauri::command]
fn installed_apps() -> Vec<Installed> {
    vec![detect_squeeze()]
}

#[tauri::command]
fn launch_app(id: String) -> Result<(), String> {
    if id != "squeeze" {
        return Err("this app is not available yet".into());
    }
    let d = detect_squeeze();
    if !d.installed {
        return Err("Squeeze is not installed".into());
    }
    Command::new(&d.exe).spawn().map(|_| ()).map_err(|e| format!("could not start Squeeze: {e}"))
}

// ---------------------------------------------------------------- downloads

#[derive(Serialize, Clone)]
struct Progress {
    task: String,
    phase: String,
    done: u64,
    total: u64,
}

fn emit(app: &AppHandle, task: &str, phase: &str, done: u64, total: u64) {
    let _ = app.emit("progress", Progress { task: task.into(), phase: phase.into(), done, total });
}

/// Streams `url` into `dest`, emitting progress; returns the SHA-256 (hex) of the bytes written.
fn download(app: &AppHandle, task: &str, phase: &str, url: &str, dest: &Path) -> Result<String, String> {
    let mut r = client(None)?.get(url).send().map_err(|e| format!("network: {e}"))?;
    if !r.status().is_success() {
        return Err(format!("download failed: {}", r.status()));
    }
    let total = r.content_length().unwrap_or(0);
    let part = dest.with_extension("part");
    let mut f = fs::File::create(&part).map_err(|e| e.to_string())?;
    let mut h = Sha256::new();
    let (mut done, mut buf, mut last) = (0u64, vec![0u8; 1 << 16], Instant::now());
    emit(app, task, phase, 0, total);
    loop {
        let k = r.read(&mut buf).map_err(|e| format!("network: {e}"))?;
        if k == 0 {
            break;
        }
        f.write_all(&buf[..k]).map_err(|e| e.to_string())?;
        h.update(&buf[..k]);
        done += k as u64;
        if last.elapsed() > Duration::from_millis(120) {
            emit(app, task, phase, done, total);
            last = Instant::now();
        }
    }
    f.flush().map_err(|e| e.to_string())?;
    drop(f);
    if total > 0 && done != total {
        let _ = fs::remove_file(&part);
        return Err("download was cut short".into());
    }
    fs::rename(&part, dest).map_err(|e| e.to_string())?;
    emit(app, task, phase, done, done.max(total));
    Ok(h.finalize().iter().map(|b| format!("{b:02x}")).collect())
}

fn unique(dir: &Path, name: &str) -> PathBuf {
    let p = dir.join(name);
    if !p.exists() {
        return p;
    }
    let (stem, ext) = name.rsplit_once('.').unwrap_or((name, ""));
    (1..1000).map(|i| dir.join(format!("{stem} ({i}).{ext}"))).find(|p| !p.exists()).unwrap_or(p)
}

#[derive(Serialize)]
struct InstallResult {
    version: String,
    sha256: String,
    ran_installer: bool,
    installed: Installed,
}

fn do_install(app: &AppHandle, data: &Path) -> Result<InstallResult, String> {
    let task = "install:squeeze";
    emit(app, task, "Finding the latest release", 0, 0);
    let info = fetch_github()?;
    let prefix = format!("https://github.com/{REPO}/releases/download/");
    let (rel, asset) = info
        .releases
        .iter()
        .find_map(|r| r.assets.iter().find(|a| a.name.starts_with("Squeeze_") && a.name.ends_with("_x64-setup.exe")).map(|a| (r, a)))
        .ok_or("no Windows installer found in the releases")?;
    let sums = rel.assets.iter().find(|a| a.name == "SHA256.txt").ok_or("the release has no SHA256.txt, so the installer cannot be checked")?;
    if !asset.url.starts_with(&prefix) || !sums.url.starts_with(&prefix) || asset.name.contains(['/', '\\']) {
        return Err("unexpected download address".into());
    }
    let sums_text = client(Some(Duration::from_secs(30)))?
        .get(&sums.url)
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.text())
        .map_err(|e| format!("network: {e}"))?;
    let expected = sums_text
        .lines()
        .find_map(|l| {
            let mut it = l.split_whitespace();
            let (h, f) = (it.next()?, it.next()?);
            (f.trim_start_matches('*') == asset.name).then(|| h.to_ascii_lowercase())
        })
        .ok_or("SHA256.txt does not list the installer")?;
    let dir = data.join("downloads");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(&asset.name);
    let got = download(app, task, "Downloading", &asset.url, &dest)?;
    if got != expected {
        let _ = fs::remove_file(&dest);
        return Err("the downloaded installer does not match its published SHA-256; it was deleted".into());
    }
    let version = rel.tag.clone();
    if std::env::var("CS_LAUNCHER_DRY_INSTALL").is_ok() {
        emit(app, task, "Verified (dry run, installer not started)", 1, 1);
        return Ok(InstallResult { version, sha256: got, ran_installer: false, installed: detect_squeeze() });
    }
    emit(app, task, "Installing", 0, 0);
    let st = Command::new(&dest).arg("/S").status().map_err(|e| format!("could not start the installer: {e}"))?;
    if !st.success() {
        return Err(format!("the installer stopped with {st}"));
    }
    let installed = detect_squeeze();
    if !installed.installed {
        return Err("the installer finished but Squeeze was not found".into());
    }
    emit(app, task, "Installed", 1, 1);
    Ok(InstallResult { version, sha256: got, ran_installer: true, installed })
}

#[tauri::command]
async fn install_app(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<InstallResult, String> {
    if id != "squeeze" {
        return Err("this app is not available yet".into());
    }
    let data = state.data.clone();
    tauri::async_runtime::spawn_blocking(move || do_install(&app, &data)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn download_source(app: AppHandle, state: State<'_, AppState>, id: String, tag: Option<String>) -> Result<String, String> {
    if id != "squeeze" {
        return Err("the source for this app is not published yet".into());
    }
    let r#ref = tag.clone().unwrap_or_else(|| "main".into());
    if r#ref.is_empty() || r#ref.len() > 64 || !r#ref.chars().all(|c| c.is_ascii_alphanumeric() || "._-".contains(c)) {
        return Err("invalid version name".into());
    }
    let url = match &tag {
        Some(t) => format!("https://github.com/{REPO}/archive/refs/tags/{t}.zip"),
        None => format!("https://github.com/{REPO}/archive/refs/heads/main.zip"),
    };
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let dest = unique(&dir, &format!("squeeze-source-{}.zip", r#ref));
    let task = format!("source:{id}:{}", r#ref);
    let app2 = app.clone();
    let d2 = dest.clone();
    tauri::async_runtime::spawn_blocking(move || download(&app2, &task, "Downloading source", &url, &d2)).await.map_err(|e| e.to_string())??;
    state.known.lock().unwrap().push(dest.clone());
    Ok(dest.to_string_lossy().into())
}

// ---------------------------------------------------------------- saved files

#[derive(Serialize, Clone)]
struct SavedFile {
    app: String,
    kind: String,
    name: String,
    detail: String,
    path: String,
    size: u64,
    modified: u64,
}

fn squeeze_dir(app: &AppHandle) -> Option<PathBuf> {
    app.path().data_dir().ok().map(|d| d.join("org.creatorsuite.squeeze"))
}

fn list_squeeze_files(dir: &Path) -> Vec<SavedFile> {
    let mut out = vec![];
    let presets = dir.join("presets.json");
    if let Some(Value::Array(ps)) = fs::read(&presets).ok().and_then(|b| serde_json::from_slice(&b).ok()) {
        let m = mtime_ms(&presets);
        for p in ps {
            let codec = p.get("video").and_then(|v| v.get("codec")).and_then(|c| c.as_str()).or_else(|| p.get("audio").and_then(|a| a.get("codec")).and_then(|c| c.as_str())).unwrap_or("");
            out.push(SavedFile {
                app: "squeeze".into(),
                kind: "preset".into(),
                name: s(&p, "name"),
                detail: format!("Preset · {} {}", s(&p, "container").to_uppercase(), codec.to_uppercase()).trim().to_string(),
                path: presets.to_string_lossy().into(),
                size: 0,
                modified: m,
            });
        }
    }
    let queue = dir.join("queue.json");
    if let Some(q) = fs::read(&queue).ok().and_then(|b| serde_json::from_slice::<Value>(&b).ok()) {
        let mut seen = std::collections::HashSet::new();
        for j in q.get("jobs").and_then(|j| j.as_array()).into_iter().flatten() {
            if s(j, "state") != "done" {
                continue;
            }
            let path = s(j, "output");
            let pb = PathBuf::from(&path);
            if path.is_empty() || !pb.is_file() || !seen.insert(path.clone()) {
                continue;
            }
            let ext = pb.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
            let kind = if ["m4a", "mp3", "wav", "flac", "opus", "ogg", "aac"].contains(&ext.as_str()) { "audio" } else { "video" };
            let preset = j.get("preset").map(|p| s(p, "name")).unwrap_or_default();
            out.push(SavedFile {
                app: "squeeze".into(),
                kind: kind.into(),
                name: pb.file_name().map(|f| f.to_string_lossy().into()).unwrap_or_default(),
                detail: preset,
                size: fs::metadata(&pb).map(|m| m.len()).unwrap_or(0),
                modified: mtime_ms(&pb),
                path,
            });
        }
    }
    out.sort_by(|a, b| b.modified.cmp(&a.modified));
    out.truncate(500);
    out
}

#[tauri::command]
fn app_files(app: AppHandle, state: State<'_, AppState>) -> Vec<SavedFile> {
    let dir = std::env::var("CS_LAUNCHER_SQUEEZE_DATA").map(PathBuf::from).ok().or_else(|| squeeze_dir(&app));
    let files = dir.map(|d| list_squeeze_files(&d)).unwrap_or_default();
    let mut k = state.known.lock().unwrap();
    for f in &files {
        k.push(PathBuf::from(&f.path));
    }
    files
}

fn known(state: &AppState, path: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(path);
    if !state.known.lock().unwrap().iter().any(|k| k == &p) {
        return Err("unknown file".into());
    }
    if !p.exists() {
        return Err("the file is no longer there".into());
    }
    Ok(p)
}

#[tauri::command]
fn reveal(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let p = known(&state, &path)?;
    tauri_plugin_opener::reveal_item_in_dir(p).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_file(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let p = known(&state, &path)?;
    tauri_plugin_opener::open_path(p, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    let ok = url.starts_with(&format!("https://github.com/{REPO}")) || url == "https://www.gnu.org/licenses/gpl-3.0.html";
    if !ok {
        return Err("only the project's own pages can be opened".into());
    }
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| e.to_string())
}

#[derive(Serialize)]
struct About {
    version: String,
    repo: String,
}

#[tauri::command]
fn about(app: AppHandle) -> About {
    About { version: app.package_info().version.to_string(), repo: format!("https://github.com/{REPO}") }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data = app.path().app_data_dir()?;
            fs::create_dir_all(&data)?;
            app.manage(AppState { data, known: Mutex::new(vec![]) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![github_info, installed_apps, launch_app, install_app, download_source, app_files, reveal, open_file, open_url, about])
        .run(tauri::generate_context!())
        .expect("error while running the launcher");
}
