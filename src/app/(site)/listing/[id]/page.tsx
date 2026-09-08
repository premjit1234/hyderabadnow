import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById, getListingFieldSettings, getAmenityCatalog } from "@/db/queries";
import { formatPrice, propertyTypeLabel, projectHref } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getAppUrl } from "@/lib/site";
import { facingLabel, furnishingLabel, inventoryStateLabel } from "@/lib/listingFields";
import { AMENITIES, parseAmenities, iconForAmenity } from "@/lib/amenities";
import InquiryForm from "@/components/InquiryForm";
import ListingGallery from "@/components/ListingGallery";
import AmenityIcon from "@/components/AmenityIcon";

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

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.1-1.34A10 10 0 1 0 12 2Zm0 18.2a8.16 8.16 0 0 1-4.17-1.14l-.3-.18-3.03.8.81-2.95-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.24-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.24-.65.81-.8.98-.15.17-.29.19-.54.06-.24-.12-1.03-.38-1.97-1.22-.73-.65-1.22-1.45-1.36-1.7-.15-.24-.02-.37.11-.5.11-.11.24-.29.36-.44.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.24-.87.85-.87 2.08s.9 2.41 1.02 2.58c.12.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.46-.28Z" />
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

  const [listing, fieldSettings, amenityCatalog] = await Promise.all([
    getListingById(listingId),
    getListingFieldSettings(),
    getAmenityCatalog(),
  ]);
  if (!listing) notFound();

  const images = listing.images.length > 0 ? listing.images : [];

  const listingUrl = `${await getAppUrl()}/listing/${listing.id}`;
  const whatsappMessage = `Hi, I'm interested in your listing "${listing.title}" (${formatPrice(
    listing.price,
    listing.listingType as "sale" | "rent"
  )}) in ${listing.locality}, Hyderabad. ${listingUrl}`;
  const whatsappLink =
    listing.whatsappEnabled && listing.contactPhone
      ? buildWhatsAppLink(listing.contactPhone, whatsappMessage)
      : null;

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
          {listing.project && (
            <Link
              href={projectHref(listing.project)}
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
            >
              Part of {listing.project.name} →
            </Link>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-2xl font-extrabold text-emerald-700 sm:text-3xl">
            {formatPrice(listing.price, listing.listingType as "sale" | "rent")}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {listing.featured && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Featured
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                listing.verified ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
              }`}
            >
              {listing.verified ? "✓ Verified" : "Not Verified"}
            </span>
            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
              {listing.listingType === "sale" ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListingGallery images={images} title={listing.title} />

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

          {(() => {
            const unitDetails = [
              fieldSettings.towerName.public && listing.towerName && { label: "Tower", value: listing.towerName },
              fieldSettings.unitNumber.public && listing.unitNumber && { label: "Unit Number", value: listing.unitNumber },
              fieldSettings.unitFloor.public && listing.unitFloor != null && { label: "Floor", value: String(listing.unitFloor) },
              fieldSettings.facing.public && listing.facing && { label: "Facing", value: facingLabel(listing.facing) },
              fieldSettings.furnishingStatus.public &&
                listing.furnishingStatus && { label: "Furnishing", value: furnishingLabel(listing.furnishingStatus) },
              fieldSettings.inventoryState.public && { label: "Inventory State", value: inventoryStateLabel(listing.inventoryState) },
            ].filter((d): d is { label: string; value: string } => Boolean(d));

            if (unitDetails.length === 0) return null;
            return (
              <div className="mt-8">
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Unit details
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {unitDetails.map((d) => (
                    <div key={d.label}>
                      <dt className="text-xs text-stone-500">{d.label}</dt>
                      <dd className="text-sm font-medium text-stone-900">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })()}

          {(() => {
            const pricingDetails = [
              fieldSettings.sellerAskPrice.public &&
                listing.sellerAskPrice != null && {
                  label: "Seller Ask Price",
                  value: formatPrice(listing.sellerAskPrice, listing.listingType as "sale" | "rent"),
                },
              fieldSettings.sellerBestPrice.public &&
                listing.sellerBestPrice != null && {
                  label: "Seller Best Price",
                  value: formatPrice(listing.sellerBestPrice, listing.listingType as "sale" | "rent"),
                },
              fieldSettings.cashRatioPercent.public &&
                listing.cashRatioPercent != null && { label: "Cash Ratio", value: `${listing.cashRatioPercent}%` },
            ].filter((d): d is { label: string; value: string } => Boolean(d));

            if (pricingDetails.length === 0) return null;
            return (
              <div className="mt-8">
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Pricing details
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {pricingDetails.map((d) => (
                    <div key={d.label}>
                      <dt className="text-xs text-stone-500">{d.label}</dt>
                      <dd className="text-sm font-medium text-stone-900">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })()}

          {fieldSettings.amenities.public &&
            (() => {
              const amenityKeys = parseAmenities(listing.amenities);
              if (amenityKeys.length === 0) return null;
              const catalogByKey = new Map(amenityCatalog.map((a) => [a.key, a.label]));
              const listingAmenities = amenityKeys
                .map((key) => ({ key, label: catalogByKey.get(key) ?? key }))
                .filter((a) => catalogByKey.has(a.key));
              if (listingAmenities.length === 0) return null;

              return (
                <div className="mt-8">
                  <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Amenities
                  </h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {listingAmenities.map((a) => (
                      <span key={a.key} className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                        <AmenityIcon icon={iconForAmenity(a.key)} className="h-4 w-4 text-emerald-700" />
                        {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

          {listing.project &&
            (() => {
              const project = listing.project;
              const projectAmenityKeys = parseAmenities(project.amenities);
              const projectAmenities = AMENITIES.filter((a) => projectAmenityKeys.includes(a.key));
              const facts = [
                { label: "Status", value: project.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction" },
                project.bhkOptions && { label: "BHK options", value: `${project.bhkOptions.split(",").join(", ")} BHK` },
                project.minAreaSqft != null &&
                  project.maxAreaSqft != null && {
                    label: "Area range",
                    value: `${project.minAreaSqft.toLocaleString("en-IN")}–${project.maxAreaSqft.toLocaleString("en-IN")} sqft`,
                  },
                project.totalUnits != null && { label: "Total units", value: String(project.totalUnits) },
                project.towers != null && { label: "Towers", value: String(project.towers) },
                project.possessionYear != null && { label: "Possession", value: String(project.possessionYear) },
              ].filter((f): f is { label: string; value: string } => Boolean(f));

              return (
                <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        Part of this project
                      </h2>
                      <p className="mt-1 text-lg font-bold text-stone-900">{project.name}</p>
                      {project.developerName && <p className="text-sm text-stone-500">by {project.developerName}</p>}
                    </div>
                    <Link
                      href={projectHref(project)}
                      className="whitespace-nowrap rounded-md bg-stone-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                      View project details →
                    </Link>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    {facts.map((f) => (
                      <div key={f.label}>
                        <dt className="text-xs text-stone-500">{f.label}</dt>
                        <dd className="text-sm font-medium text-stone-900">{f.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {projectAmenities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone-200 pt-4">
                      {projectAmenities.slice(0, 6).map((a) => (
                        <span key={a.key} className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                          <AmenityIcon icon={a.icon} className="h-4 w-4 text-emerald-700" />
                          {a.label}
                        </span>
                      ))}
                      {projectAmenities.length > 6 && (
                        <span className="text-xs font-medium text-stone-400">
                          +{projectAmenities.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
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

            {listing.contactPhone && (
              <div className="mt-4 border-t border-stone-200 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Contact about this listing
                </p>
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-emerald-700"
                >
                  <PhoneIcon className="h-4 w-4 text-emerald-700" />
                  {listing.contactPhone}
                </a>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-md bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Connect on WhatsApp
                  </a>
                )}
              </div>
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
