"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProjectGallery({
  images,
  alt,
}: {
  images: { id: number; url: string }[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-100 text-stone-400">
        No photos yet
      </div>
    );
  }

  const next = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-stone-200 shadow-sm">
        <Image
          src={images[activeIndex].url}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white"
          >
            ›
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${
                i === activeIndex ? "border-emerald-600" : "border-transparent"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
