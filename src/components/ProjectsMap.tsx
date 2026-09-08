"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { formatPrice, propertyTypeLabel } from "@/lib/format";

export type MapProject = {
  id: number;
  slug: string | null;
  name: string;
  locality: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  constructionStatus: "under_construction" | "ready_to_move";
  imageUrl: string | null;
  minSalePrice: number | null;
  minRentPrice: number | null;
  saleListings: number;
  rentListings: number;
};

// Hyderabad city center — used as the map's default view when nothing on
// the current page has a pin yet (e.g. every project still needs geocoding).
const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export default function ProjectsMap({ projects }: { projects: MapProject[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Leaflet touches `window` at import time, so it must load only in
      // the browser — dynamic import keeps it out of the server bundle.
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(HYDERABAD_CENTER, 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const pinned = projects.filter(
        (p): p is MapProject & { latitude: number; longitude: number } => p.latitude != null && p.longitude != null
      );

      const markers: import("leaflet").Marker[] = [];
      for (const p of pinned) {
        const startingPrice = p.minSalePrice ?? p.minRentPrice;
        const startingPriceType: "sale" | "rent" = p.minSalePrice != null ? "sale" : "rent";
        const priceLabel = startingPrice != null ? formatPrice(startingPrice, startingPriceType) : null;

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#b91c1c;color:#fff;font:600 11px system-ui,sans-serif;padding:4px 9px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.35);white-space:nowrap;border:2px solid #fff;">${escapeHtml(
            priceLabel ?? propertyTypeLabel(p.propertyType)
          )}</div>`,
          iconSize: undefined,
          iconAnchor: [24, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map);
        const href = `/projects/${p.slug || p.id}`;
        const img = p.imageUrl
          ? `<img src="${escapeHtml(p.imageUrl)}" style="width:100%;height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />`
          : `<div style="width:100%;height:110px;background:#f5f5f4;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;color:#a8a29e;font:12px system-ui,sans-serif;">No photo</div>`;
        const statusLabel = p.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction";

        marker.bindPopup(
          `<a href="${href}" style="display:block;width:230px;text-decoration:none;color:inherit;font-family:system-ui,sans-serif;margin:-13px -20px -13px -20px;">
            ${img}
            <div style="padding:9px 12px 11px;">
              <div style="font-size:11px;font-weight:600;color:#047857;text-transform:uppercase;letter-spacing:.03em;margin-bottom:2px;">${escapeHtml(
                statusLabel
              )}</div>
              <div style="font-weight:700;font-size:13.5px;color:#1c1917;line-height:1.3;margin-bottom:2px;">${escapeHtml(
                p.name
              )}</div>
              <div style="font-size:12px;color:#78716c;margin-bottom:5px;">${escapeHtml(p.locality)}, ${escapeHtml(
                p.city
              )}</div>
              ${
                priceLabel
                  ? `<div style="font-size:13px;font-weight:600;color:#1c1917;">Starting from ${escapeHtml(priceLabel)}</div>`
                  : ""
              }
              <div style="font-size:11px;color:#4338ca;margin-top:3px;font-weight:500;">${p.saleListings} for sale · ${p.rentListings} for rent</div>
            </div>
          </a>`,
          { minWidth: 230, maxWidth: 230 }
        );
        markers.push(marker);
      }

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 14 });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [projects]);

  const pinnedCount = projects.filter((p) => p.latitude != null && p.longitude != null).length;

  return (
    <div>
      {projects.length > 0 && pinnedCount < projects.length && (
        <p className="mb-2 text-xs text-stone-500">
          Showing {pinnedCount} of {projects.length} project{projects.length === 1 ? "" : "s"} with a known location
          on the map.
        </p>
      )}
      <div ref={containerRef} className="h-[600px] w-full overflow-hidden rounded-lg border border-stone-200" />
    </div>
  );
}
