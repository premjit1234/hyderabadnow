import { getSiteSettings } from "@/db/queries";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";

export default async function AdminSiteSettingsPage() {
  const { logoUrl, faviconUrl, heroImageUrl, dashboardBannerImageUrl, dashboardBannerLinkUrl, featuredCreditPriceRupees } =
    await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Site settings</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Branding shown across the public site — changes apply immediately, no redeploy needed.
      </p>
      <SiteSettingsForm
        logoUrl={logoUrl}
        faviconUrl={faviconUrl}
        heroImageUrl={heroImageUrl}
        dashboardBannerImageUrl={dashboardBannerImageUrl}
        dashboardBannerLinkUrl={dashboardBannerLinkUrl}
        featuredCreditPriceRupees={featuredCreditPriceRupees}
      />
    </div>
  );
}
