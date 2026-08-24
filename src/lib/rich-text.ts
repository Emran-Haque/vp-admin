/**
 * Helpers for the limited rich text stored on "what you get" bullets.
 *
 * The public site parses this markup into React elements against the same
 * allowlist, so anything not listed here is dropped rather than rendered.
 * Sanitising here keeps pasted Word/Docs markup from reaching the API at all.
 */

/** Inline tags kept in both modes. Everything else is unwrapped to its text. */
const INLINE_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "DEL", "CODE", "MARK", "SUB", "SUP", "BR", "A", "SPAN",
]);

/**
 * Extra tags kept in "block" mode — the full editor used for descriptions.
 * Bullets stay inline-only, so a one-line bullet can never sprout a heading.
 */
const BLOCK_ONLY_TAGS = new Set([
  // DIV is kept because contentEditable wraps aligned text in one.
  "P", "DIV", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "HR", "PRE",
]);

/** Block tags flattened to line breaks when they are not kept as-is. */
const BLOCK_TAGS = new Set(["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TR"]);

/** Inline styles the editor may set; each value must match its own pattern. */
const COLOR = /^#[0-9a-f]{3,8}$|^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)$/i;
const FONT_SIZE = /^(?:xx-small|x-small|small|medium|large|x-large|xx-large)$|^\d{1,2}(?:\.\d+)?(?:px|pt|em|rem)$/i;

const STYLE_RULES: Record<string, RegExp> = {
  "color": COLOR,
  "background-color": COLOR,
  "font-size": FONT_SIZE,
  "text-align": /^(?:left|right|center|justify)$/i,
  "font-weight": /^(?:normal|bold|bolder|lighter|[1-9]00)$/i,
  "font-style": /^(?:normal|italic)$/i,
  "text-decoration": /^(?:none|underline|line-through)$/i,
};

/** Keeps only the declarations the public renderer will actually honour. */
function safeStyle(raw: string): string {
  const kept: string[] = [];
  for (const part of raw.split(";")) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    const property = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    const test = STYLE_RULES[property];
    if (test && test.test(value)) kept.push(`${property}: ${value}`);
  }
  return kept.join("; ");
}

/** Elements dropped along with their contents. */
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT"]);

function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  // Blocks javascript: and data: URLs an editor paste could smuggle in.
  return null;
}

export type RichTextMode = "inline" | "block";

function clean(node: Node, out: Node[], doc: Document, mode: RichTextMode) {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(doc.createTextNode(node.nodeValue ?? ""));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  const tag = element.tagName.toUpperCase();
  if (DROP_TAGS.has(tag)) return;

  const children: Node[] = [];
  element.childNodes.forEach((child) => clean(child, children, doc, mode));

  if (tag === "BR") {
    out.push(doc.createElement("br"));
    return;
  }

  const keepable =
    INLINE_TAGS.has(tag) || (mode === "block" && BLOCK_ONLY_TAGS.has(tag));

  if (keepable) {
    const kept = doc.createElement(tag.toLowerCase());

    if (tag === "A") {
      const href = safeHref(element.getAttribute("href") ?? "");
      if (!href) {
        // A link with nowhere safe to go keeps its text but loses the anchor.
        children.forEach((child) => out.push(child));
        return;
      }
      kept.setAttribute("href", href);
    }

    // Colour / size / alignment survive, filtered to the allowlisted values.
    const style = safeStyle(element.getAttribute("style") ?? "");
    if (style) kept.setAttribute("style", style);

    // A <span> carrying nothing useful is just noise from contentEditable.
    if (tag === "SPAN" && !style) {
      children.forEach((child) => out.push(child));
      return;
    }

    children.forEach((child) => kept.appendChild(child));
    out.push(kept);
    return;
  }

  // Unknown or (in inline mode) block element: keep the text, and separate
  // blocks with a break so pasted paragraphs do not run together.
  if (BLOCK_TAGS.has(tag) && out.length && children.length) {
    out.push(doc.createElement("br"));
  }
  children.forEach((child) => out.push(child));
}

/**
 * Strips authored markup down to what the public site will actually render.
 *
 * `inline` (the default) is for one-line bullets: block tags are flattened to
 * line breaks. `block` is for descriptions, where headings, lists and
 * paragraphs are part of the point.
 */
export function sanitizeRichText(html: string, mode: RichTextMode = "inline"): string {
  if (!html) return "";
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const out: Node[] = [];
  doc.body.childNodes.forEach((child) => clean(child, out, doc, mode));

  const holder = doc.createElement("div");
  out.forEach((node) => holder.appendChild(node));
  const result = holder.innerHTML.trim();

  // Leading/trailing breaks are an artefact of editing, never intent.
  return result
    .replace(/(<br\s*\/?>)+$/i, "")
    .replace(/^(<br\s*\/?>)+/i, "")
    .trim();
}

/** Convenience wrapper for the full description editor. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeRichText(html, "block");
}

/** True when a bullet has no visible text (an untouched blank row). */
export function isRichTextEmpty(html: string): boolean {
  if (!html) return true;
  if (typeof window === "undefined") return !html.replace(/<[^>]*>/g, "").trim();
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return !(doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

export type IncludeDraft = { id: string; text: string; icon: string };

export type IncludePayload = { text: string; icon: string; ordering: number };

/** Builds the API value for `includes` — sanitised, blank rows dropped, ordered. */
export function serializeIncludes(items: IncludeDraft[]): IncludePayload[] {
  return items
    .filter((item) => !isRichTextEmpty(item.text))
    .map((item, index) => ({
      text: sanitizeRichText(item.text),
      icon: item.icon.trim(),
      ordering: index,
    }));
}

/** Turns the API's `includes` back into editable rows. */
export function draftsFromIncludes(
  items: { id?: number; text?: string; icon?: string }[] | undefined | null,
): IncludeDraft[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: String(item.id ?? `row-${index}`),
    text: item.text ?? "",
    icon: item.icon ?? "",
  }));
}
