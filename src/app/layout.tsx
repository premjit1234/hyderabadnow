import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteSettings } from "@/db/queries";

// The whole site is built as a single light theme — every component uses
// explicit light Tailwind colors (bg-white, text-stone-900, etc.), none of
// them react to a "dark:" variant. Without this, a phone or browser set to
// dark mode (very common on Android) auto-darkens the page background while
// leaving that hardcoded dark text untouched, producing near-black-on-black
// text that's unreadable. Declaring colorScheme: "light" tells the browser
// this page is light-only, so it renders it as designed instead of trying
// to force a dark theme onto it.
export const viewport: Viewport = {
  colorScheme: "light",
};

// The favicon is admin-editable (see /admin/settings), so it can't use the
// static app/favicon.ico file convention — that's fixed at build time. This
// reads the current favicon from the database on every request instead,
// falling back to the bundled default (a cropped Charminar-and-skyline mark,
// no wordmark — see public/favicon-default.ico) when no admin upload has
// been made yet.
export async function generateMetadata(): Promise<Metadata> {
  const { faviconUrl } = await getSiteSettings();
  return {
    title: "HyderabadNow — Property Listings in Hyderabad",
    description:
      "Buy and rent apartments, villas, and plots across Hyderabad. Listings posted directly by agents and owners.",
    icons: {
      icon: faviconUrl || "/favicon-default.ico",
      // Only for the bundled default — an admin-uploaded favicon (see
      // /admin/settings) is whatever single file they chose, so there's no
      // separate high-res variant of it to point this at. Google explicitly
      // recommends a favicon larger than 48x48 "so that it looks good on
      // various surfaces" (search results, bookmarks, iOS home screen); the
      // old default.ico topped out at 32x32, which is almost certainly why
      // Search was showing a generic globe instead of our icon.
      apple: faviconUrl ? undefined : "/apple-touch-icon.png",
    },
  };
}

// This is the app-wide root layout — it only owns <html>/<body>. The public
// site's Header/Footer chrome lives in src/app/(site)/layout.tsx, so /admin
// (a sibling of the (site) route group, not nested in it) renders with its
// own distinct shell (admin/layout.tsx) instead of the consumer-site chrome.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Google AdSense site-verification snippet, rendered as a plain,
          literal <script> tag rather than next/script. We tried
          next/script with strategy="beforeInteractive" first, but that
          only *registers* the script via a small inline JS payload in the
          initial HTML and inserts the real <script src=...> element into
          the DOM client-side, milliseconds before hydration — it is never
          present as literal text in the server-rendered HTML response.
          Google's AdSense verifier (unlike Googlebot's own indexer) reads
          the raw HTML response and string-matches the exact snippet it
          gave us, so that client-injected version never gets seen and
          verification kept failing. A plain server-rendered <script> tag
          has no such indirection: it's literal HTML text from the first
          byte, so both a text-matching verifier and a JS-executing browser
          see the exact same tag Google asked us to place. Next.js allows
          (though generally discourages) a manual <head> in the root
          layout for cases the generateMetadata API doesn't cover — this
          is one of them, since the Metadata API's `verification` field
          only emits <meta> tags, never a <script src>. */}
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3121616318120913"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-stone-900 font-sans">{children}</body>
    </html>
  );
}
