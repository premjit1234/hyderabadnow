"use client";

import { useEffect, useRef } from "react";

// Renders an admin-pasted ad network snippet (Google AdSense's "Ad unit"
// code, or similar) and makes its <script> tags actually run.
//
// Why this can't just be a dangerouslySetInnerHTML: browsers deliberately
// do not execute <script> elements created via innerHTML (or React's
// dangerouslySetInnerHTML, which is the same mechanism under the hood) —
// that's a long-standing DOM security behavior, not a bug to work around
// with a library. A naive render would show a blank space and load
// nothing. The fix is the standard "script re-creation" technique: parse
// the snippet into a detached <template>, then for every node either (a)
// it's a <script>, in which case clone it with document.createElement and
// copy over its attributes/text so the browser treats it as a freshly
// inserted, executable script, or (b) it's anything else, in which case a
// plain node clone is enough since only <script> is special-cased by the
// DOM this way.
export default function AdSlotRenderer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html.trim()) return;

    container.innerHTML = "";
    const template = document.createElement("template");
    template.innerHTML = html;

    for (const node of Array.from(template.content.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "SCRIPT") {
        const oldScript = node as HTMLScriptElement;
        const newScript = document.createElement("script");
        for (const attr of Array.from(oldScript.attributes)) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.text = oldScript.text;
        container.appendChild(newScript);
      } else {
        container.appendChild(node.cloneNode(true));
      }
    }

    // Cleanup on unmount / html change — avoids a stray ad slot's script
    // re-running against a container that's about to disappear (e.g. a
    // client-side route change that keeps this component mounted for a
    // tick under React's transition handling).
    return () => {
      container.innerHTML = "";
    };
  }, [html]);

  return <div ref={containerRef} />;
}
