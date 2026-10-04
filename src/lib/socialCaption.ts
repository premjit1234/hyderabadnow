import { formatPrice, propertyTypeLabel } from "./format";

// Hashtags people searching Hyderabad real estate on Instagram/X actually
// use — a mix of broad ("#HyderabadRealEstate") and specific ("#Gachibowli")
// so the post has a shot at both. Kept short and generic on purpose: the
// per-listing/per-post functions below append locality/type-specific tags
// on top of this fixed base.
const BASE_HASHTAGS = ["#HyderabadRealEstate", "#HyderabadProperty", "#HyderabadNow"];

function toHashtag(s: string): string {
  // "Kondapur, Hyderabad" -> "#Kondapur" — strips anything that isn't a
  // letter/number so a messy locality string never produces a broken tag.
  const cleaned = s.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned ? `#${cleaned}` : "";
}

/** A ready-to-post caption for a single listing — used by PromoteShareLinks
 * on the owner/agent-facing listing edit page so posting to WhatsApp
 * Status, X, Facebook, or LinkedIn is a one-click "copy, paste, done"
 * instead of writing new ad copy by hand every time. */
export function buildListingSocialCaption(
  listing: {
    title: string;
    bhk: number | null;
    propertyType: string;
    listingType: string;
    locality: string;
    price: number;
  },
  url: string
): string {
  const bhkPart = listing.bhk ? `${listing.bhk} BHK ` : "";
  const action = listing.listingType === "rent" ? "for rent" : "for sale";
  const price = formatPrice(listing.price, listing.listingType as "sale" | "rent");
  const hashtags = [BASE_HASHTAGS[0], toHashtag(listing.locality), BASE_HASHTAGS[1], BASE_HASHTAGS[2]]
    .filter(Boolean)
    .join(" ");

  return (
    `${bhkPart}${propertyTypeLabel(listing.propertyType)} ${action} in ${listing.locality}, Hyderabad — ${price}.\n` +
    `${listing.title}\n\n` +
    `View details & photos: ${url}\n\n` +
    hashtags
  );
}

/** Same idea for a blog post — used on the admin blog edit page so a new
 * locality guide or market update has a ready caption the moment it's
 * published, rather than that being a separate manual task someone has to
 * remember to do later (or never does). */
export function buildBlogSocialCaption(post: { title: string; excerpt: string | null }, url: string): string {
  const hook = post.excerpt?.trim() || "New on the HyderabadNow blog.";
  const hashtags = [BASE_HASHTAGS[0], "#HyderabadGuide", BASE_HASHTAGS[2]].join(" ");

  return `${post.title}\n\n${hook}\n\nRead it here: ${url}\n\n${hashtags}`;
}
