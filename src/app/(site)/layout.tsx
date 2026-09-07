import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ViewTracker from "@/components/ViewTracker";

// Everything under (site) is the public, consumer-facing part of the app —
// it gets the shared Header/Footer chrome. /admin lives outside this route
// group (a sibling of (site), not nested in it) so it gets its own distinct
// shell from admin/layout.tsx instead — see that file. ViewTracker is mounted
// here for the same reason: it only ever sees public-page navigations, which
// is exactly what the admin Analytics page's traffic stats should count.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewTracker />
      <Header />
      {children}
      <Footer />
    </>
  );
}
