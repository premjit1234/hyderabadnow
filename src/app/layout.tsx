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
// falling back to the bundled default green-H icon when no admin upload
// has been made yet.
export async function generateMetadata(): Promise<Metadata> {
  const { faviconUrl } = await getSiteSettings();
  return {
    title: "HyderabadNow — Property Listings in Hyderabad",
    description:
      "Buy and rent apartments, villas, and plots across Hyderabad. Listings posted directly by agents and owners.",
    icons: {
      icon: faviconUrl || "/favicon-default.ico",
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
      <body className="flex min-h-full flex-col bg-white text-stone-900 font-sans">{children}</body>
    </html>
  );
}
