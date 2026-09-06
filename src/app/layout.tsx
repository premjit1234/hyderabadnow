import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyderabadNow — Property Listings in Hyderabad",
  description:
    "Buy and rent apartments, villas, and plots across Hyderabad. Listings posted directly by agents and owners.",
};

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
