// Renders admin-authored legal page content. Content is plain text — never
// HTML — split into paragraphs on blank lines, with a lightweight "## "
// convention for section headings. Deliberately no dangerouslySetInnerHTML:
// whatever the admin types renders as plain paragraphs/headings only, never
// as arbitrary markup.
export default function LegalContent({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return <p className="text-stone-500">This page hasn&rsquo;t been filled in yet.</p>;
  }

  return (
    <div>
      {blocks.map((block, i) => {
        // A block can be "## Heading" alone, or "## Heading" followed by its
        // paragraph on the next line (only a blank line starts a new block,
        // so heading + body commonly share one) — split those two apart
        // rather than rendering the whole block as one bold heading line.
        const lines = block.split("\n");
        if (lines[0].startsWith("## ")) {
          const heading = lines[0].slice(3).trim();
          const body = lines.slice(1).join("\n").trim();
          return (
            <div key={i}>
              <h2 className="mb-3 mt-8 text-lg font-bold text-stone-900 first:mt-0">{heading}</h2>
              {body && <p className="mb-4 whitespace-pre-line leading-relaxed text-stone-700">{body}</p>}
            </div>
          );
        }
        return (
          <p key={i} className="mb-4 whitespace-pre-line leading-relaxed text-stone-700">
            {block}
          </p>
        );
      })}
    </div>
  );
}
