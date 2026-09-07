"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type GalleryImage = { id: number; url: string };

// The photo grid on the listing detail page — same 1-big-plus-4-small layout
// as before, but every thumbnail now opens a full-screen lightbox (click to
// zoom, arrow buttons/keys or swipe-by-click to move between photos, Escape
// or the backdrop to close) instead of doing nothing.
export default function ListingGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const extraCount = Math.max(0, images.length - 5);

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKeyDown);
    // Lightbox open — stop the page behind it from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-100 text-stone-400">
        No photos yet
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-xl shadow-sm sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="relative aspect-[16/10] cursor-zoom-in sm:col-span-3 sm:row-span-2 sm:aspect-auto"
        >
          <Image src={images[0].url} alt={title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" priority />
        </button>
        {images.slice(1, 5).map((img, i) => {
          const isLastVisible = i === 3 && extraCount > 0;
          return (
            <button
              type="button"
              key={img.id}
              onClick={() => setOpenIndex(i + 1)}
              className="relative hidden aspect-square cursor-zoom-in sm:block"
            >
              <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
              {isLastVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  +{extraCount} more
                </div>
              )}
            </button>
          );
        })}
      </div>

      {openIndex !== null &&
        createPortal(
          // Rendered via a portal straight onto <body> — the sticky header
          // lives in a separate part of the tree with its own stacking
          // context, and some browsers paint it above a same-page fixed
          // overlay nested deep under <main> regardless of z-index. Making
          // this a direct sibling of the header removes that ambiguity
          // entirely, so the lightbox always covers the whole page.
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setOpenIndex(null)}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            >
              ×
            </button>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-4"
              >
                ‹
              </button>
            )}

            <div className="relative h-full max-h-[85vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[openIndex].url}
                alt={title}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i + 1) % images.length));
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-4"
              >
                ›
              </button>
            )}

            {images.length > 1 && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
                {openIndex + 1} / {images.length}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
