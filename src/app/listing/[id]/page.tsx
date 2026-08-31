import Image from "next/image";
import { notFound } from "next/navigation";
import { getListingById } from "@/db/queries";
import { formatPrice, propertyTypeLabel } from "@/lib/format";
import InquiryForm from "@/components/InquiryForm";

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

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-sm text-stone-500">
          {listing.locality}, {listing.city}
        </p>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{listing.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {images.length > 0 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-lg">
              <div className="relative col-span-4 row-span-1 aspect-[16/9] sm:col-span-3 sm:row-span-2">
                <Image
                  src={images[0].url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              </div>
              {images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative hidden aspect-square sm:block">
                  <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-stone-100 text-stone-400">
              No photos yet
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-6 border-y border-stone-200 py-4 text-sm">
            <div>
              <p className="text-stone-500">Price</p>
              <p className="text-lg font-bold text-stone-900">
                {formatPrice(listing.price, listing.listingType as "sale" | "rent")}
              </p>
            </div>
            {listing.bhk != null && (
              <div>
                <p className="text-stone-500">Bedrooms</p>
                <p className="font-semibold text-stone-900">{listing.bhk} BHK</p>
              </div>
            )}
            {listing.areaSqft != null && (
              <div>
                <p className="text-stone-500">Area</p>
                <p className="font-semibold text-stone-900">
                  {listing.areaSqft.toLocaleString("en-IN")} sqft
                </p>
              </div>
            )}
            <div>
              <p className="text-stone-500">Type</p>
              <p className="font-semibold text-stone-900">{propertyTypeLabel(listing.propertyType)}</p>
            </div>
            <div>
              <p className="text-stone-500">Listing</p>
              <p className="font-semibold text-stone-900">
                {listing.listingType === "sale" ? "For Sale" : "For Rent"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-lg font-bold text-stone-900">About this property</h2>
            <p className="whitespace-pre-line text-stone-700">{listing.description}</p>
          </div>

          {listing.address && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-bold text-stone-900">Address</h2>
              <p className="text-stone-700">{listing.address}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-lg border border-stone-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Listed by
            </p>
            <p className="mt-1 font-semibold text-stone-900">{listing.owner?.name ?? "Owner"}</p>
            {listing.owner?.agencyName && (
              <p className="text-sm text-stone-500">{listing.owner.agencyName}</p>
            )}
            {listing.owner?.phone && (
              <p className="mt-1 text-sm text-stone-700">{listing.owner.phone}</p>
            )}
            <div className="mt-4 border-t border-stone-200 pt-4">
              <InquiryForm listingId={listing.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
