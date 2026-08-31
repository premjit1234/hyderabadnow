import Link from "next/link";
import Image from "next/image";
import type { HomeCategory } from "@/db/queries";

export default function CategoryTile({ category }: { category: HomeCategory }) {
  return (
    <Link
      href={category.href}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-200"
    >
      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-stone-900">
        {category.count}
      </span>
      <span className="absolute bottom-3 left-3 right-3 text-[15px] font-semibold text-white">
        {category.label}
      </span>
    </Link>
  );
}
