import Link from "next/link";
import Image from "next/image";
import { formatPrice, propertyTypeLabel, projectHref } from "@/lib/format";

// Same shape as the fields selected in getFeaturedProjects (see db/queries.ts)
// — kept intentionally narrow (only what the card renders) rather than the
// full project row, same convention as ListingCard's ListingCardData.
export type ProjectCardData = {
  id: number;
  slug: string | null;
  name: string;
  locality: string;
  city: string;
  propertyType: string;
  constructionStatus: string;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  bhkOptions: string | null;
  possessionYear: number | null;
  reraApprovalYear: number | null;
  imageUrl: string | null;
  saleListings: number;
  rentListings: number;
  minSalePrice: number | null;
  minRentPrice: number | null;
};

// Card markup mirrors the inline project card on /projects (see that page)
// so a project looks the same wherever it's shown — pulled out here so the
// homepage's "Featured projects" section doesn't have to duplicate it.
export default function ProjectCard({ project }: { project: ProjectCardData }) {
  const startingPrice = project.minSalePrice ?? project.minRentPrice;
  const startingPriceType: "sale" | "rent" = project.minSalePrice != null ? "sale" : "rent";

  return (
    <Link
      href={projectHref(project)}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">No photo</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white">
          {project.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction"}
        </span>
        {project.reraApprovalYear && (
          <span className="absolute right-2 top-2 rounded bg-emerald-700/90 px-2 py-0.5 text-xs font-semibold text-white">
            RERA
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="line-clamp-1 text-base font-bold text-stone-900">{project.name}</p>
        <p className="text-sm text-stone-500">
          {project.locality}, {project.city}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
          <span>{propertyTypeLabel(project.propertyType)}</span>
          {project.bhkOptions && <span>{project.bhkOptions.split(",").join(", ")} BHK</span>}
          {project.minAreaSqft && project.maxAreaSqft && (
            <span>
              {project.minAreaSqft.toLocaleString("en-IN")}–{project.maxAreaSqft.toLocaleString("en-IN")} sqft
            </span>
          )}
          {project.constructionStatus === "under_construction" && project.possessionYear && (
            <span>Possession {project.possessionYear}</span>
          )}
        </div>
        {startingPrice != null && (
          <p className="mt-1 text-sm font-semibold text-stone-900">
            Starting from {formatPrice(startingPrice, startingPriceType)}
          </p>
        )}
        <p className="mt-1 text-xs font-medium text-indigo-700">
          {project.saleListings} for sale · {project.rentListings} for rent
        </p>
      </div>
    </Link>
  );
}
