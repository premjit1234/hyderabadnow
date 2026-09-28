import sanitizeHtml from "sanitize-html";

// Allowlist for blog post / locality guide body content, authored via the
// admin's rich text editor (components/admin/RichTextEditor.tsx, a Tiptap
// instance since it replaced the old execCommand-based editor — see that
// file for why). Deliberately narrow: no <iframe>/<script>/<style>/inline
// event handlers or style attributes — cover photo, gallery, and video each
// have their own dedicated field too (see schema.ts blogPosts comment).
// table/thead/tbody/tr/th/td are allowed (with colspan/rowspan only, no
// inline width/style) so the editor's table tool and pasted Word/Excel/
// Google Docs tables survive a save — Tiptap's table extension always
// normalizes pasted tables down to this exact shape before it ever reaches
// here, so nothing more exotic (merged-cell colgroups, mso- styles) shows up.
// <img> IS allowed, restricted to `src`/`alt` only (no inline style/onerror/
// etc.) so an admin can drop uploaded photos inline into the article body via
// the editor's "Image" button (see RichTextEditor.tsx and admin/actions.ts's
// uploadContentImageAction) — the surrounding `allowedSchemes` still blocks a
// javascript:/data: URL from ever reaching a live <img src>. Applied both
// when a post is saved AND again on every render, so a bug in the editor (or
// a row edited directly in the database) can never reach the page as live
// markup.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  });
}
