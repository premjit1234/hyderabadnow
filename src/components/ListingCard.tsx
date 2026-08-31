import Link from "next/link";
import Image from "next/image";
import { formatPrice, propertyTypeLabel } from "@/lib/format";

export type ListingCardData = {
  id: number;
  title: string;
  price: number;
  listingType: "sale" | "rent";
  propertyType: string;
  bhk: number | null;
  areaSqft: number | null;
  locality: string;
  featured: boolean;
  imageUrl: string | null;
};

export default function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">No photo</div>
        )}
        {listing.featured && (
          <span className="absolute left-2 top-2 rounded bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
            Featured
          </span>
        )}
        <span className="absolute right-2 top-2 rounded bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white">
          {listing.listingType === "sale" ? "For Sale" : "For Rent"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-lg font-bold text-stone-900">
          {formatPrice(listing.price, listing.listingType)}
        </p>
        <p className="line-clamp-1 text-sm font-medium text-stone-800">{listing.title}</p>
        <p className="text-sm text-stone-500">{listing.locality}, Hyderabad</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
          {listing.bhk ? <span>{listing.bhk} BHK</span> : null}
          {listing.areaSqft ? <span>{listing.areaSqft.toLocaleString("en-IN")} sqft</span> : null}
          <span>{propertyTypeLabel(listing.propertyType)}</span>
        </div>
      </div>
    </Link>
  );
}
