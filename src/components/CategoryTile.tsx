import Link from "next/link";
import Image from "next/image";
import type { HomeCategory } from "@/db/queries";

export default function CategoryTile({ category }: { category: HomeCategory }) {
  return (
    <Link
      href={category.href}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-stone-200 to-stone-300 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        // No admin-uploaded photo yet — a soft gradient plus a simple house
        // glyph reads as an intentional placeholder rather than a blank/
        // broken-looking gray box, until a real photo is uploaded.
        <div className="flex h-full items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-stone-400/70">
            <path
              d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {category.count != null && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-stone-900">
          {category.count}
        </span>
      )}
      <span className="absolute bottom-3 left-3 right-3 text-[15px] font-semibold text-white">
        {category.label}
      </span>
    </Link>
  );
}
