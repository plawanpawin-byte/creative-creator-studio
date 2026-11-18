// Tiny, safe Markdown subset for release notes: everything is escaped first; links become plain text.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) =>
  esc(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|\s)_([^_]+)_(?=\s|$)/g, "$1<i>$2</i>");

export function md(src: string, maxLines = 400): string {
  const out: string[] = [];
  let list = false;
  const close = () => list && (out.push("</ul>"), (list = false));
  for (const raw of src.split(/\r?\n/).slice(0, maxLines)) {
    const l = raw.trimEnd();
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    const li = /^\s*[-*+]\s+(.*)$/.exec(l);
    if (h) {
      close();
      out.push(`<h4>${inline(h[2])}</h4>`);
    } else if (li) {
      if (!list) out.push("<ul>"), (list = true);
      out.push(`<li>${inline(li[1])}</li>`);
    } else if (!l.trim()) {
      close();
    } else {
      close();
      out.push(`<p>${inline(l.replace(/^>\s?/, ""))}</p>`);
    }
  }
  close();
  return out.join("");
}
