<script lang="ts">
  // Line icons on a 24px grid (stroke = currentColor).
  let { name, size = 18, fill = false }: { name: string; size?: number; fill?: boolean } = $props();
  const P: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    apps: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    news: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12.5h7M7 16h4",
    files: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    source: "M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15",
    search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20",
    star: "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z",
    fork: "M7 5.5a2 2 0 1 0 0 .01M17 5.5a2 2 0 1 0 0 .01M12 18.5a2 2 0 1 0 0 .01M7 7.5v1.5a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7.5M12 12v4.5",
    eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    issue: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.2v.3",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    tag: "M3 12V4h8l9.5 9.5-8 8zM7.5 8.5a1 1 0 1 0 0-.01",
    back: "M15 5l-7 7 7 7",
    fwd: "M9 5l7 7-7 7",
    chev: "M9.5 6l6 6-6 6",
    refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4.5V11h-6.5",
    download: "M12 3.5v12M7 11l5 5 5-5M4.5 20h15",
    external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    reveal: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v5M9.5 13.5 12 11l2.5 2.5",
    film: "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z",
    wave: "M3 12h2M7 8v8M11 4v16M15 7v10M19 10v4M21 12h0",
    keys: "M3 5h18v14H3zM8 5v9M13 5v9M18 5v9M6.5 14v5M10.5 14v5M15.5 14v5",
    photo: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01",
    pencil: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",
    slides: "M3 4h18v12H3zM12 16v4M8 20h8M7 12l3-3 2 2 4-4",
    doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6M9 9h2",
    grid: "M4 4h16v16H4zM4 9.5h16M4 15h16M9.5 4v16",
    preset: "M5 4v16M12 4v16M19 4v16M3 8h4M10 15h4M17 10h4",
    music: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    video: "M3 6h12v12H3zM15 10l6-3.5v11L15 14",
    check: "M5 12.5l4.5 4.5L19 7.5",
    close: "M6 6l12 12M18 6 6 18",
    min: "M5 12h14",
    max: "M5 5h14v14H5z",
    copy: "M8 8h12v12H8zM16 8V4H4v12h4",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.3",
    shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-4.5",
    play: "M7 4.5v15L19.5 12z",
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={P[name] ?? P.info} />
</svg>
