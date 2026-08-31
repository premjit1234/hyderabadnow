import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "HyderabadNow — Property Listings in Hyderabad",
  description:
    "Buy and rent apartments, villas, and plots across Hyderabad. Listings posted directly by agents and owners.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-stone-900 font-sans">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
