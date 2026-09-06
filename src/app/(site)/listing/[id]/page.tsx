import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getListingById } from "@/db/queries";
import { formatPrice, propertyTypeLabel } from "@/lib/format";
import InquiryForm from "@/components/InquiryForm";

function BedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18v2M21 18v2M3 12V8a1 1 0 0 1 1-1h6v5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="9.5" r="1.25" />
    </svg>
  );
}

function AreaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12M4 21h16M8 8h1M8 12h1M8 16h1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M12.5 3H5a1 1 0 0 0-1 1v7.5a1 1 0 0 0 .3.7l9.5 9.5a1 1 0 0 0 1.4 0l7.5-7.5a1 1 0 0 0 0-1.4l-9.5-9.5a1 1 0 0 0-.7-.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="8.5" r="1.25" />
    </svg>
  );
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const listing = await getListingById(listingId);
  if (!listing) notFound();

  const images = listing.images.length > 0 ? listing.images : [];
  const extraCount = Math.max(0, images.length - 5);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/browse"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-emerald-700"
      >
        ← Back to listings
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-sm text-stone-500">
            <PinIcon className="h-4 w-4 shrink-0" />
            {listing.locality}, {listing.city}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {listing.title}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-2xl font-extrabold text-emerald-700 sm:text-3xl">
            {formatPrice(listing.price, listing.listingType as "sale" | "rent")}
          </p>
          <div className="flex gap-2">
            {listing.featured && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Featured
              </span>
            )}
            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
              {listing.listingType === "sale" ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-xl shadow-sm sm:grid-cols-4 sm:grid-rows-2">
              <div className="relative aspect-[16/10] sm:col-span-3 sm:row-span-2 sm:aspect-auto">
                <Image
                  src={images[0].url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              </div>
              {images.slice(1, 5).map((img, i) => {
                const isLastVisible = i === 3 && extraCount > 0;
                return (
                  <div key={img.id} className="relative hidden aspect-square sm:block">
                    <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
                    {isLastVisible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                        +{extraCount} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-100 text-stone-400">
              No photos yet
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-4">
            {listing.bhk != null && (
              <div className="flex items-center gap-2.5">
                <BedIcon className="h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">Bedrooms</p>
                  <p className="text-sm font-semibold text-stone-900">{listing.bhk} BHK</p>
                </div>
              </div>
            )}
            {listing.areaSqft != null && (
              <div className="flex items-center gap-2.5">
                <AreaIcon className="h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">Area</p>
                  <p className="text-sm font-semibold text-stone-900">
                    {listing.areaSqft.toLocaleString("en-IN")} sqft
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <BuildingIcon className="h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-500">Type</p>
                <p className="text-sm font-semibold text-stone-900">
                  {propertyTypeLabel(listing.propertyType)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <TagIcon className="h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-500">Listing</p>
                <p className="text-sm font-semibold text-stone-900">
                  {listing.listingType === "sale" ? "For Sale" : "For Rent"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              About this property
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-stone-700">{listing.description}</p>
          </div>

          {listing.address && (
            <div className="mt-8">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Address
              </h2>
              <p className="flex items-start gap-1.5 text-stone-700">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                {listing.address}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white">
                {(listing.owner?.name ?? "O").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Listed by
                </p>
                <p className="font-semibold text-stone-900">{listing.owner?.name ?? "Owner"}</p>
                {listing.owner?.agencyName && (
                  <p className="text-xs text-stone-500">{listing.owner.agencyName}</p>
                )}
              </div>
            </div>
            {listing.owner?.phone && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-stone-700">
                <PhoneIcon className="h-4 w-4 text-emerald-700" />
                {listing.owner.phone}
              </p>
            )}
            <div className="mt-4 border-t border-stone-200 pt-4">
              <p className="mb-3 text-sm font-semibold text-stone-900">Send a message</p>
              <InquiryForm listingId={listing.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
