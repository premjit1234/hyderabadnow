// Search-engine-facing helpers for a project's page (see
// src/app/(site)/projects/[slug]/page.tsx) — same pattern as listingSeo.ts,
// applied to projects instead of individual listings.
import { propertyTypeLabel } from "./format";
import { absoluteUrl, buildBreadcrumbJsonLd } from "./seo";

type ProjectForSeo = {
  id: number;
  slug: string | null;
  name: string;
  developerName: string | null;
  locality: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  constructionStatus: string;
  totalUnits: number | null;
  towers: number | null;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  bhkOptions: string | null;
  possessionYear: number | null;
  description: string | null;
  createdAt: string;
  images: { url: string }[];
};

/** Same slug-or-id fallback as lib/format.ts's projectHref, so SEO URLs
 * always match the actual URL the project page resolves at. */
export function projectSeoPath(project: Pick<ProjectForSeo, "id" | "slug">): string {
  return `/projects/${project.slug || project.id}`;
}

export function buildProjectSeoTitle(
  project: Pick<ProjectForSeo, "name" | "developerName" | "locality" | "city">
): string {
  const byDeveloper = project.developerName ? ` by ${project.developerName}` : "";
  return `${project.name}${byDeveloper} in ${project.locality}, ${project.city}`;
}

export function buildProjectSeoDescription(
  project: Pick<
    ProjectForSeo,
    "propertyType" | "constructionStatus" | "bhkOptions" | "minAreaSqft" | "maxAreaSqft" | "locality" | "city" | "possessionYear" | "description"
  >
): string {
  const bhk = project.bhkOptions
    ? `${project.bhkOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ")} BHK`
    : null;
  const area =
    project.minAreaSqft != null && project.maxAreaSqft != null
      ? `${project.minAreaSqft.toLocaleString("en-IN")}–${project.maxAreaSqft.toLocaleString("en-IN")} sqft`
      : null;
  const status =
    project.constructionStatus === "ready_to_move"
      ? "Ready to move"
      : project.possessionYear
        ? `possession ${project.possessionYear}`
        : "Under construction";
  const facts = [propertyTypeLabel(project.propertyType), bhk, area, status].filter(Boolean).join(", ");
  const lead = `${facts} in ${project.locality}, ${project.city}.`;
  const remaining = 158 - lead.length;
  const tail = project.description && remaining > 20 ? ` ${project.description.slice(0, remaining - 1).trim()}` : "";
  return `${lead}${tail}`;
}

/** schema.org ApartmentComplex — the dedicated type for a residential
 * project with multiple units for sale/rent, so it's the closest fit for
 * apartment/villa/independent-house projects. Commercial and plot projects
 * have no equally natural schema.org "complex" type, so they fall back to
 * the generic Place, which still carries name/address/geo. Like
 * RealEstateListing on a listing page, this isn't tied to a specific Google
 * rich-result treatment — it's still valid markup that helps search engines
 * understand what the page actually is. */
export function buildProjectJsonLd(project: ProjectForSeo, appUrl: string) {
  const url = `${appUrl}${projectSeoPath(project)}`;
  const images = project.images.map((img) => absoluteUrl(img.url, appUrl));
  const isResidential = ["apartment", "villa", "independent_house"].includes(project.propertyType);

  return {
    "@context": "https://schema.org",
    "@type": isResidential ? "ApartmentComplex" : "Place",
    "@id": url,
    url,
    name: project.name,
    ...(project.description && { description: project.description }),
    ...(images.length > 0 && { image: images }),
    address: {
      "@type": "PostalAddress",
      addressLocality: project.locality,
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    ...(project.latitude != null &&
      project.longitude != null && {
        geo: { "@type": "GeoCoordinates", latitude: project.latitude, longitude: project.longitude },
      }),
    ...(isResidential && project.totalUnits != null && { numberOfAccommodationUnits: project.totalUnits }),
    ...(isResidential && project.towers != null && { numberOfBuildings: project.towers }),
  };
}

export function buildProjectBreadcrumbJsonLd(project: Pick<ProjectForSeo, "id" | "slug" | "name">, appUrl: string) {
  return buildBreadcrumbJsonLd([
    { name: "Home", item: appUrl },
    { name: "Projects", item: `${appUrl}/projects` },
    { name: project.name, item: `${appUrl}${projectSeoPath(project)}` },
  ]);
}
