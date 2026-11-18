// The suite's apps. Only Squeeze exists today; the others are planned and say so.
export type Category = "video" | "audio" | "image" | "work";
export type AppEntry = {
  id: string;
  name: string;
  subtitle: string;
  category: Category;
  available: boolean;
  description: string;
  icon: { img?: string; glyph?: string; from: string; to: string };
  stack?: string;
  shots?: { src: string; title: string; text: string }[];
};

export const CATEGORIES: { id: Category; name: string; blurb: string }[] = [
  { id: "video", name: "Video & Motion", blurb: "Encode, edit and animate" },
  { id: "audio", name: "Music & Audio", blurb: "Record, mix and perform" },
  { id: "image", name: "Photo & Design", blurb: "Edit pictures and draw" },
  { id: "work", name: "Documents & Ideas", blurb: "Write, present and plan" },
];

export const APPS: AppEntry[] = [
  {
    id: "squeeze",
    name: "Squeeze",
    subtitle: "Batch video & audio converter",
    category: "video",
    available: true,
    stack: "Rust · Tauri · Svelte · FFmpeg",
    description:
      "Convert many video and audio files at once with ready-made presets for the web, phones, editing and archiving. Works offline, checks every output, and never uploads your media.",
    icon: { img: "/media/squeeze-icon.png", from: "#0a84ff", to: "#5e5ce6" },
    shots: [
      { src: "/media/squeeze-inspector.jpg", title: "Inspector", text: "General, Video and Audio settings per output." },
      { src: "/media/squeeze-active.jpg", title: "Active", text: "Live progress, then every output is checked." },
      { src: "/media/squeeze-audio.jpg", title: "Audio", text: "Pick streams, codec and bit rate." },
    ],
  },
  { id: "video-editor", name: "Video Editor", subtitle: "Timeline editing", category: "video", available: false, description: "A timeline video editor. Planned.", icon: { glyph: "film", from: "#5e5ce6", to: "#bf5af2" } },
  { id: "motion", name: "Motion", subtitle: "Titles & motion graphics", category: "video", available: false, description: "Animated titles and effects. Planned.", icon: { glyph: "sparkle", from: "#ff375f", to: "#ff9f0a" } },
  { id: "music-studio", name: "Music Studio", subtitle: "Record and mix", category: "audio", available: false, description: "Multitrack recording and mixing. Planned.", icon: { glyph: "wave", from: "#ff453a", to: "#ff9f0a" } },
  { id: "live-stage", name: "Live Stage", subtitle: "Play live with plug-ins", category: "audio", available: false, description: "Live performance host. Planned.", icon: { glyph: "keys", from: "#30d158", to: "#0a84ff" } },
  { id: "photo-editor", name: "Photo Editor", subtitle: "Layers and adjustments", category: "image", available: false, description: "Photo and image editing. Planned.", icon: { glyph: "photo", from: "#64d2ff", to: "#0a84ff" } },
  { id: "canvas", name: "Canvas", subtitle: "Boards for ideas", category: "image", available: false, description: "An open whiteboard. Planned.", icon: { glyph: "pencil", from: "#ffd60a", to: "#ff9f0a" } },
  { id: "slides", name: "Slides", subtitle: "Presentations", category: "work", available: false, description: "Presentations. Planned.", icon: { glyph: "slides", from: "#ff9f0a", to: "#ff375f" } },
  { id: "docs", name: "Docs", subtitle: "Word processing", category: "work", available: false, description: "Documents and page layout. Planned.", icon: { glyph: "doc", from: "#0a84ff", to: "#64d2ff" } },
  { id: "sheets", name: "Sheets", subtitle: "Spreadsheets", category: "work", available: false, description: "Spreadsheets and charts. Planned.", icon: { glyph: "grid", from: "#30d158", to: "#66d4a0" } },
];

export const appById = (id: string) => APPS.find((a) => a.id === id);
