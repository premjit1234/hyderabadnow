"use client";

import { useRef } from "react";

// A small dependency-free rich text editor for blog post bodies: a
// contentEditable <div> driven by the browser's own editing commands
// (document.execCommand — deprecated, but still universally supported for
// exactly this kind of basic bold/italic/list/link chrome, and it avoids
// pulling in a whole editor library for a handful of buttons). Its HTML is
// mirrored into a hidden <input> on every change so it travels as a normal
// form field — the server action sanitizes it again before saving (see
// lib/sanitizeHtml.ts), so nothing this editor produces is trusted as-is.
export default function RichTextEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sync() {
    if (editorRef.current && hiddenRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addLink() {
    editorRef.current?.focus();
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  }

  const buttonClass =
    "rounded px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-white hover:text-stone-900";

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-md border border-stone-200 bg-stone-50 p-1.5">
        <button type="button" onClick={() => exec("bold")} className={buttonClass}>
          <span className="font-bold">B</span>
        </button>
        <button type="button" onClick={() => exec("italic")} className={buttonClass}>
          <span className="italic">I</span>
        </button>
        <button type="button" onClick={() => exec("underline")} className={buttonClass}>
          <span className="underline">U</span>
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button type="button" onClick={() => exec("formatBlock", "H2")} className={buttonClass}>
          Heading
        </button>
        <button type="button" onClick={() => exec("formatBlock", "H3")} className={buttonClass}>
          Subheading
        </button>
        <button type="button" onClick={() => exec("formatBlock", "P")} className={buttonClass}>
          Paragraph
        </button>
        <span className="mx-1 my-1 w-px bg-stone-200" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className={buttonClass}>
          • List
        </button>
        <button type="button" onClick={() => exec("insertOrderedList")} className={buttonClass}>
          1. List
        </button>
        <button type="button" onClick={() => exec("formatBlock", "BLOCKQUOTE")} className={buttonClass}>
          Quote
        </button>
        <button type="button" onClick={addLink} className={buttonClass}>
          Link
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        dangerouslySetInnerHTML={{ __html: defaultValue ?? "" }}
        className="min-h-[240px] w-full rounded-md border border-stone-200 px-3.5 py-3 text-sm leading-relaxed text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&_a]:text-indigo-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-stone-600 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-900 [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-stone-900 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
