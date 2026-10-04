import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/db/queries";

// A single modern, geometric-but-warm typeface for the whole site. Exposed
// as the CSS variable --font-manrope (see globals.css, which wires it in as
// the Tailwind `font-sans` stack) rather than applied directly here, so
// every existing `font-sans` className site-wide picks it up automatically
// — no per-component className changes needed for the typography lift.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // All three optional and admin-set from /admin/settings (see
  // SiteSettingsForm.tsx's "Marketing & analytics" card) — each script below
  // only renders once its own ID is actually configured, so a fresh install
  // with none of this set loads nothing extra at all.
  const { gaMeasurementId, metaPixelId, googleAdsConversionId } = await getSiteSettings();

  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable}`}>
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
      <body className="flex min-h-full flex-col bg-white text-stone-900 font-sans">
        {children}

        {/* GA4 + (optionally) the Google Ads conversion tag — both share
            the same gtag.js loader and queue, so a single config call
            covers GA4 reporting and, when googleAdsConversionId is also
            set, lets `trackEvent()` (lib/analytics.ts) fire Ads conversions
            too. strategy="afterInteractive" per Next's own guidance for
            analytics scripts: loads early but never blocks first paint. */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
                ${googleAdsConversionId ? `gtag('config', '${googleAdsConversionId}');` : ""}
              `}
            </Script>
          </>
        )}

        {/* Google Ads conversion tag on its own, for the (less common) case
            where ads conversion tracking is wanted without GA4 configured. */}
        {!gaMeasurementId && googleAdsConversionId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsConversionId}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${googleAdsConversionId}');
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel — standard base code, loaded only once a Pixel ID is
            configured. */}
        {metaPixelId && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
