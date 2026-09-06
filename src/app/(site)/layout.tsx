import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Everything under (site) is the public, consumer-facing part of the app —
// it gets the shared Header/Footer chrome. /admin lives outside this route
// group (a sibling of (site), not nested in it) so it gets its own distinct
// shell from admin/layout.tsx instead — see that file.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
