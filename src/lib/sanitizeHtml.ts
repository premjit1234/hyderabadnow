import sanitizeHtml from "sanitize-html";

// Allowlist for blog post / locality guide body content, authored via the
// admin's rich text editor (components/admin/RichTextEditor.tsx). Deliberately
// narrow: no <iframe>/<script>/<style>/inline event handlers or style
// attributes — cover photo, gallery, and video each have their own dedicated
// field too (see schema.ts blogPosts comment). <img> IS allowed, restricted to
// `src`/`alt` only (no inline style/onerror/etc.) so an admin can drop
// uploaded photos inline into the article body via the editor's "Image"
// button (see RichTextEditor.tsx and admin/actions.ts's
// uploadContentImageAction) — the surrounding `allowedSchemes` still blocks a
// javascript:/data: URL from ever reaching a live <img src>. Applied both
// when a post is saved AND again on every render, so a bug in the editor (or
// a row edited directly in the database) can never reach the page as live
// markup.
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "blockquote", "a", "img"];

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  });
}
