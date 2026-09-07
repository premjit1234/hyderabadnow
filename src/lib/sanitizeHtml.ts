import sanitizeHtml from "sanitize-html";

// Allowlist for blog post body content, authored via the admin's rich text
// editor (components/admin/RichTextEditor.tsx). Deliberately narrow: no
// <img>/<iframe>/<script>/<style>/inline event handlers or style attributes
// — cover photo, gallery, and video each have their own dedicated field
// (see schema.ts blogPosts comment), so the body never needs to embed media
// itself. Applied both when a post is saved AND again on every render, so a
// bug in the editor (or a row edited directly in the database) can never
// reach the page as live markup.
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "blockquote", "a"];

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  });
}
