/**
 * Tiny, dependency-free markdown renderer for the preview pane.
 *
 * Scope is intentionally narrow: headings, bold, italic, inline code,
 * code blocks, links, blockquotes, unordered/ordered lists, hr, paragraphs.
 * Everything is HTML-escaped before transformation, so user content can
 * never inject markup. Only the substitutions in this file produce HTML.
 */

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(input) {
  return String(input).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

/** Inline transforms: code, bold, italic, links — applied to already-escaped text. */
function inline(text) {
  return text
    // inline code
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    // bold (** or __)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    // italic (* or _) — non-greedy, avoid clashing with bold
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>")
    // links [text](url) — only http/https/mailto
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
    );
}

/** Block-level renderer. */
export function renderMarkdown(src) {
  if (!src || !src.trim()) return "";

  const lines = escapeHtml(src).split("\n");
  const out = [];
  let i = 0;

  function flushParagraph(buf) {
    if (buf.length === 0) return;
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre class="md-pre"><code>${buf.join("\n")}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^&gt;\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^&gt;\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // Unordered list — supports GitHub-style task items (- [ ] / - [x]).
    // Detection is per-item so a list can mix checkboxes and plain bullets.
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      let hasTask = false;
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const body = lines[i].replace(/^\s*[-*+]\s+/, "");
        const task = /^\[([ xX])\]\s*(.*)$/.exec(body);
        if (task) {
          hasTask = true;
          const checked = task[1] !== " ";
          items.push(
            `<li class="md-task">` +
              `<input type="checkbox" disabled${checked ? " checked" : ""} />` +
              `<span>${inline(task[2])}</span>` +
              `</li>`,
          );
        } else {
          items.push(`<li>${inline(body)}</li>`);
        }
        i++;
      }
      const cls = hasTask ? ' class="md-tasklist"' : "";
      out.push(`<ul${cls}>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ol>`);
      continue;
    }

    // Paragraph (collapse adjacent non-empty lines)
    if (line.trim() === "") {
      i++;
      continue;
    }
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|\s*[-*+]\s|\s*\d+\.\s|&gt;\s|```|---|\*\*\*|___)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    flushParagraph(buf);
  }

  return out.join("\n");
}
