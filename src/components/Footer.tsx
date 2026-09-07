import Link from "next/link";
import { getLegalPages, getSocialLinks } from "@/db/queries";
import SocialIcon from "@/components/SocialIcon";

export default async function Footer() {
  const [legalPages, socialLinks] = await Promise.all([getLegalPages(), getSocialLinks()]);

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-500 sm:px-6">
        <p>
          HyderabadNow — property listings for Hyderabad, from agents and owners directly.
        </p>
        <p className="mt-1">
          This is a local development build. Prices and listings shown are sample data.
        </p>

        {(legalPages.length > 0 || socialLinks.length > 0) && (
          <div className="mt-6 flex flex-col items-center gap-4 border-t border-stone-200 pt-6">
            {legalPages.length > 0 && (
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-stone-600">
                {legalPages.map((page) => (
                  <Link key={page.slug} href={`/${page.slug}`} className="hover:text-emerald-700 hover:underline">
                    {page.title}
                  </Link>
                ))}
              </nav>
            )}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="text-stone-500 transition hover:text-emerald-700"
                  >
                    <SocialIcon platform={link.platform} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
