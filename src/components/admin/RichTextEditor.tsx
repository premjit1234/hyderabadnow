"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { uploadContentImageAction } from "@/app/admin/actions";

// A Tiptap-based rich text editor for blog post / locality guide bodies.
//
// This replaced an earlier, dependency-free version built on
// document.execCommand + a plain contentEditable <div>. That approach
// worked for simple typing, but execCommand is a deprecated, notoriously
// inconsistent browser API: pasting anything rich (a Word/Google Docs
// paragraph, an Excel/Docs table) drops deeply nested spans and inline
// styles the browser then can't reliably format or delete through, which is
// exactly the "can't delete text", "formatting doesn't work", and "pasted
// tables come out wrong" reports this rewrite fixes. Tiptap (ProseMirror)
// instead edits a proper document schema — every keystroke, paste, and
// toolbar action, including a pasted table, is normalized into that schema
// before it ever hits the DOM, so there's no broken markup left for
// backspace or the toolbar to trip over. The schema below is deliberately
// limited to exactly what sanitizeBlogContent (lib/sanitizeHtml.ts) allows
// to save, so nothing the toolbar lets an admin create can silently vanish
// after saving.
//
// Its HTML is mirrored into a hidden <input> on every change so it travels
// as a normal form field, same contract as before — the server action
// sanitizes it again before saving, so nothing this editor produces is
// trusted as-is.
export default function RichTextEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    // Next.js renders this on the server first; Tiptap's own hydration pass
    // then takes over on the client. Without this flag Tiptap tries to
    // render (and diff against) content during SSR itself, which for a
    // contentEditable node reliably produces a hydration mismatch warning.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Every disabled node/mark below produces a tag outside
        // ALLOWED_TAGS in sanitizeBlogContent — turning them off here means
        // the toolbar simply can't offer them, rather than letting an admin
        // create formatting that quietly disappears the moment they save.
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { alt: "" } }),
      // withHeaderRow only sets the *default* shape for a freshly-inserted
      // table (see insertTable() below) — a pasted Word/Excel/Google Docs
      // table is parsed on its own merits by this same extension, not forced
      // into this shape.
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: defaultValue ?? "",
    editorProps: {
      attributes: {
        class:
          "blog-content min-h-[240px] w-full focus:outline-none [&_table]:my-0 [&_p:last-child]:mb-0",
      },
    },
    onUpdate: ({ editor }) => sync(editor),
  });

  function sync(ed: Editor) {
    if (hiddenRef.current) {
      hiddenRef.current.value = ed.getHTML();
    }
  }

  function addLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://…) — leave blank to remove", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  // Opens the OS file picker; the actual upload + insert happens in
  // handleImageFile once a file is chosen (see the hidden <input> below).
  function addImage() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset immediately so picking the exact same file again still fires
    // this handler (the browser otherwise treats it as "no change").
    e.target.value = "";
    if (!file || !editor) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const result = await uploadContentImageAction(formData);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      editor.chain().focus().setImage({ src: result.url, alt: "" }).run();
    } catch {
      setUploadError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!editor) {
    // Renders once, briefly, before the editor initializes on the client —
    // still submits whatever defaultValue already held via the hidden input.
    return (
      <div>
        <div className="min-h-[240px] w-full rounded-md border border-stone-200 px-3.5 py-3 text-sm text-stone-400">
          Loading editor…
        </div>
        <input type="hidden" name={name} defaultValue={defaultValue ?? ""} />
      </div>
    );
  }

  const btn = (active: boolean) =>
    `rounded px-2.5 py-1.5 text-xs font-medium transition ${
      active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-white hover:text-stone-900"
    }`;
  const btnDisabled = "rounded px-2.5 py-1.5 text-xs font-medium text-stone-300";

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-md border border-stone-200 bg-stone-50 p-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive("underline"))}
        >
          <span className="underline">U</span>
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))}
        >
          Subheading
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={btn(editor.isActive("paragraph"))}
        >
          Paragraph
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive("blockquote"))}
        >
          Quote
        </button>
        <button type="button" onClick={addLink} className={btn(editor.isActive("link"))}>
          Link
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button type="button" onClick={addImage} disabled={uploading} className={`${btn(false)} disabled:opacity-50`}>
          {uploading ? "Uploading…" : "Image"}
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          disabled={!editor.can().insertTable()}
          className={editor.can().insertTable() ? btn(false) : btnDisabled}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          className={editor.can().addRowAfter() ? btn(false) : btnDisabled}
        >
          + Row
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className={editor.can().addColumnAfter() ? btn(false) : btnDisabled}
        >
          + Column
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className={editor.can().deleteTable() ? btn(false) : btnDisabled}
        >
          Delete table
        </button>
      </div>
      {uploadError && <p className="mb-2 text-xs text-red-600">{uploadError}</p>}

      <div className="rounded-md border border-stone-200 px-3.5 py-3 leading-relaxed text-stone-800 focus-within:ring-2 focus-within:ring-indigo-500">
        <EditorContent editor={editor} />
      </div>
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleImageFile}
        className="hidden"
      />
    </div>
  );
}
