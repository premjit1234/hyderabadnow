"use client";

import { useActionState } from "react";
import { adminUpdateSiteSettingsAction, type ActionState } from "@/app/admin/actions";

export default function SiteSettingsForm({
  logoUrl,
  faviconUrl,
  heroImageUrl,
  dashboardBannerImageUrl,
  dashboardBannerLinkUrl,
}: {
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  dashboardBannerImageUrl: string | null;
  dashboardBannerLinkUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    adminUpdateSiteSettingsAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Website logo</h2>
        <p className="mt-1 text-sm text-stone-500">
          Shown at the top-left of every public page. Leave unset to use the default text wordmark.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-32 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Current logo" className="h-11 w-auto object-contain" />
            ) : (
              <span className="text-xs text-stone-400">No custom logo</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              name="logoFile"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
            {logoUrl && (
              <label className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <input type="checkbox" name="removeLogo" className="h-3.5 w-3.5" />
                Remove logo (revert to default text logo)
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Favicon</h2>
        <p className="mt-1 text-sm text-stone-500">
          The small icon shown in browser tabs. Accepts .ico, .png, or .svg. Leave unset to use the default icon.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faviconUrl || "/favicon-default.ico"} alt="Current favicon" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1">
            <input
              type="file"
              name="faviconFile"
              accept="image/x-icon,image/png,image/svg+xml,.ico,.png,.svg"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
            {faviconUrl && (
              <label className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <input type="checkbox" name="removeFavicon" className="h-3.5 w-3.5" />
                Remove favicon (revert to default icon)
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Homepage hero background</h2>
        <p className="mt-1 text-sm text-stone-500">
          The photo behind the &ldquo;Find your next home in Hyderabad&rdquo; banner. Leave unset to use the default
          illustrated skyline.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-stone-300 bg-stone-50">
            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="Current hero background" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-stone-400">Default skyline</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              name="heroImageFile"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
            {heroImageUrl && (
              <label className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <input type="checkbox" name="removeHeroImage" className="h-3.5 w-3.5" />
                Remove photo (revert to default skyline)
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Dashboard promo banner</h2>
        <p className="mt-1 text-sm text-stone-500">
          Shown to logged-in users on their dashboard page. Leave the image unset to show nothing there.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-stone-300 bg-stone-50">
            {dashboardBannerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dashboardBannerImageUrl} alt="Current dashboard banner" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-stone-400">No banner</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              name="dashboardBannerFile"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
            {dashboardBannerImageUrl && (
              <label className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <input type="checkbox" name="removeDashboardBanner" className="h-3.5 w-3.5" />
                Remove banner
              </label>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-stone-600">
            Destination link (where the banner takes people when clicked)
          </label>
          <input
            type="url"
            name="dashboardBannerLinkUrl"
            defaultValue={dashboardBannerLinkUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-stone-400">Only used while a banner image is set above.</p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
