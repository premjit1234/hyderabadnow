// Admin-managed promo slot shown at the top of the logged-in dashboard page
// (see src/app/(site)/dashboard/page.tsx and the "Dashboard promo banner"
// section of the admin site-settings form). Deliberately simple: one image
// + one destination link, set by an admin — not a self-serve "promote your
// own listing" feature and not a third-party ad network. Renders nothing at
// all when no image is configured, so an un-set banner never leaves a gap.
export default function DashboardBanner({
  imageUrl,
  linkUrl,
}: {
  imageUrl: string | null;
  linkUrl: string | null;
}) {
  if (!imageUrl) return null;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
  );

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-stone-200 shadow-sm">
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block max-h-40">
          {image}
        </a>
      ) : (
        <div className="max-h-40">{image}</div>
      )}
    </div>
  );
}
