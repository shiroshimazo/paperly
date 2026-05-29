import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown — wikilinks", () => {
  // resolver: "Alpha" and a title with an ampersand both resolve; else null.
  const resolve = (target) => {
    const map = { alpha: "id-alpha", "tom & jerry": "id-amp" };
    return map[target.toLowerCase()] || null;
  };

  it("renders a resolved wikilink as an anchor with data-note-id", () => {
    const html = renderMarkdown("See [[Alpha]] now", resolve);
    expect(html).toContain('<a class="md-wikilink" data-note-id="id-alpha"');
    expect(html).toContain(">Alpha</a>");
  });

  it("renders an unresolved wikilink as a broken span", () => {
    const html = renderMarkdown("See [[Ghost]] now", resolve);
    expect(html).toContain('md-wikilink-broken');
    expect(html).toContain(">Ghost</span>");
    expect(html).not.toContain("data-note-id");
  });

  it("uses the alias as display text but resolves on the target", () => {
    const html = renderMarkdown("[[Alpha|the alpha note]]", resolve);
    expect(html).toContain('data-note-id="id-alpha"');
    expect(html).toContain(">the alpha note</a>");
    expect(html).not.toContain(">Alpha</a>");
  });

  it("resolves titles containing HTML-special chars (unescaped match)", () => {
    // The renderer escapes "&" to "&amp;" before transforming; resolution must
    // happen on the unescaped "Tom & Jerry" to find the note.
    const html = renderMarkdown("[[Tom & Jerry]]", resolve);
    expect(html).toContain('data-note-id="id-amp"');
    // Display text stays escaped — no raw ampersand injected.
    expect(html).toContain("Tom &amp; Jerry");
  });

  it("degrades to a broken span when no resolver is supplied", () => {
    const html = renderMarkdown("[[Alpha]]");
    expect(html).toContain("md-wikilink-broken");
    expect(html).not.toContain("data-note-id");
  });

  it("does not treat a standard [text](url) link as a wikilink", () => {
    const html = renderMarkdown("[docs](https://example.com)", resolve);
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("md-wikilink");
  });
});
