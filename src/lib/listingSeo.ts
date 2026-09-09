// Search-engine-facing helpers for a listing's page (see
// src/app/(site)/listing/[id]/page.tsx's generateMetadata and JSON-LD
// <script> tag) — kept separate from the page component since none of this
// touches rendering, just what Google (and link-preview cards) see about
// the listing.
import { propertyTypeLabel, formatPrice } from "./format";

type ListingForSeo = {
  id: number;
  title: string;
  description: string;
  price: number;
  listingType: string;
  propertyType: string;
  bhk: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  locality: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  verified: boolean;
  createdAt: string;
  images: { url: string }[];
};

/** Relative upload paths (e.g. "/uploads/xyz.jpg") need the site's own
 * origin prepended before they're valid outside the page itself — search
 * crawlers and link-preview bots fetch metadata URLs standalone, with no
 * browser tab supplying a base URL the way a normal <img> would get one. */
export function absoluteListingUrl(pathOrUrl: string, appUrl: string): string {
  return pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") ? pathOrUrl : `${appUrl}${pathOrUrl}`;
}

export function buildListingSeoTitle(
  listing: Pick<ListingForSeo, "bhk" | "propertyType" | "listingType" | "locality" | "city">
): string {
  const bhkPart = listing.bhk ? `${listing.bhk} BHK ` : "";
  const action = listing.listingType === "rent" ? "for Rent" : "for Sale";
  return `${bhkPart}${propertyTypeLabel(listing.propertyType)} ${action} in ${listing.locality}, ${listing.city}`;
}

// Meta descriptions past ~155-160 characters get truncated in Google's
// results, so this leads with the facts most likely to make someone click
// (price, size) before falling back to the listing's own description text.
export function buildListingSeoDescription(
  listing: Pick<
    ListingForSeo,
    "bhk" | "propertyType" | "listingType" | "areaSqft" | "locality" | "city" | "price" | "description"
  >
): string {
  const facts = [
    listing.bhk ? `${listing.bhk} BHK` : null,
    propertyTypeLabel(listing.propertyType),
    listing.areaSqft ? `${listing.areaSqft.toLocaleString("en-IN")} sqft` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const price = formatPrice(listing.price, listing.listingType as "sale" | "rent");
  const lead = `${facts} in ${listing.locality}, ${listing.city} — ${price}.`;
  const remaining = 158 - lead.length;
  const tail = remaining > 20 ? ` ${listing.description.slice(0, remaining - 1).trim()}` : "";
  return `${lead}${tail}`;
}

/** schema.org RealEstateListing — the standard structured-data shape for a
 * single property listing (nested Offer for price/availability, PostalAddress
 * for location). Not one of Google's documented rich-result types the way
 * Product/Recipe/etc. are, but it's still valid, widely-used markup that
 * helps search engines understand the page is a real, priced property
 * listing rather than generic content — which is the actual goal here. */
export function buildListingJsonLd(listing: ListingForSeo, appUrl: string) {
  const url = `${appUrl}/listing/${listing.id}`;
  const images = listing.images.map((img) => absoluteListingUrl(img.url, appUrl));

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: listing.title,
    description: listing.description,
    datePosted: listing.createdAt,
    ...(images.length > 0 && { image: images }),
    address: {
      "@type": "PostalAddress",
      ...(listing.address && { streetAddress: listing.address }),
      addressLocality: listing.locality,
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    ...(listing.latitude != null &&
      listing.longitude != null && {
        geo: { "@type": "GeoCoordinates", latitude: listing.latitude, longitude: listing.longitude },
      }),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "INR",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      businessFunction: listing.listingType === "rent" ? "https://schema.org/LeaseOut" : "https://schema.org/Sell",
      url,
    },
    ...(listing.bhk != null && { numberOfRooms: listing.bhk }),
    ...(listing.bathrooms != null && { numberOfBathroomsTotal: listing.bathrooms }),
    ...(listing.areaSqft != null && {
      floorSize: { "@type": "QuantitativeValue", value: listing.areaSqft, unitCode: "FTK" },
    }),
  };
}

/** BreadcrumbList — unlike RealEstateListing, this IS one of Google's
 * documented rich-result types and commonly shows the breadcrumb trail
 * directly in the search result instead of a raw URL. */
export function buildListingBreadcrumbJsonLd(
  listing: Pick<ListingForSeo, "id" | "title" | "listingType">,
  appUrl: string
) {
  const browsePath = listing.listingType === "rent" ? "/browse?listingType=rent" : "/browse?listingType=sale";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: listing.listingType === "rent" ? "Rent" : "Buy",
        item: `${appUrl}${browsePath}`,
      },
      { "@type": "ListItem", position: 3, name: listing.title, item: `${appUrl}/listing/${listing.id}` },
    ],
  };
}

/** JSON.stringify alone isn't safe to drop into a <script> tag as-is: a
 * listing's own title/description is free text a seller typed, and if it
 * ever contains the literal characters "</script>" that would prematurely
 * close the tag and let the rest be interpreted as HTML. Escaping "<"
 * neutralizes that while staying valid, parseable JSON. */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
