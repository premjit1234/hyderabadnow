"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";

// Lets an admin pin a project's exact map location — by dragging the
// marker, clicking the map, or pasting coordinates copied from Google Maps
// — as an override to the automatic locality-text geocoding that normally
// sets a project's pin (see src/lib/geocode.ts and
// adminCreateProjectAction/adminUpdateProjectAction in
// src/app/admin/actions.ts). The two hidden inputs below are only given a
// `name` (so they're actually part of the submitted form) once the admin
// has interacted with the picker in *this* session — until then the form
// submits with no latitude/longitude fields at all, and the server falls
// back to its usual auto-geocode-from-locality behavior untouched. Vanilla
// Leaflet, not react-leaflet — see ProjectsMap.tsx for why.
const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867];

const markerIconHtml =
  '<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:#dc2626;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);transform:rotate(-45deg);"></div>';

export default function LocationPicker({
  defaultLatitude,
  defaultLongitude,
}: {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [latText, setLatText] = useState(defaultLatitude != null ? String(defaultLatitude) : "");
  const [lngText, setLngText] = useState(defaultLongitude != null ? String(defaultLongitude) : "");
  const [touched, setTouched] = useState(false);

  // Keeps the map/marker in sync when a text field holds a valid pair,
  // without forcing the inputs themselves to be controlled by parsed
  // numbers — that would make it impossible to type a leading "-" or a
  // trailing "." while entering a coordinate.
  function syncMarkerFromText(lat: string, lng: string) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180) {
      markerRef.current?.setLatLng([parsedLat, parsedLng]);
      mapRef.current?.panTo([parsedLat, parsedLng]);
    }
  }

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const start: [number, number] =
        defaultLatitude != null && defaultLongitude != null ? [defaultLatitude, defaultLongitude] : HYDERABAD_CENTER;

      const map = L.map(mapContainerRef.current).setView(start, defaultLatitude != null ? 15 : 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({ className: "", html: markerIconHtml, iconSize: [20, 20], iconAnchor: [10, 20] });
      const marker = L.marker(start, { icon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setLatText(lat.toFixed(6));
        setLngText(lng.toFixed(6));
        setTouched(true);
      });

      map.on("click", (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setLatText(e.latlng.lat.toFixed(6));
        setLngText(e.latlng.lng.toFixed(6));
        setTouched(true);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intentionally runs once on mount only — the map/marker are then
    // driven imperatively via the refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Exact location</p>
      <p className="mb-3 text-xs text-stone-500">
        Click the map or drag the pin to set the exact spot, or paste coordinates copied from Google Maps
        (right-click a spot there and click the latitude/longitude shown at the top of the menu to copy them).
        Left untouched, the location is guessed automatically from the locality above.
      </p>
      <div ref={mapContainerRef} className="h-64 w-full overflow-hidden rounded-md border border-stone-200" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">Latitude</label>
          <input
            type="text"
            inputMode="decimal"
            value={latText}
            onChange={(e) => {
              setLatText(e.target.value);
              setTouched(true);
              syncMarkerFromText(e.target.value, lngText);
            }}
            placeholder="e.g. 17.423900"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">Longitude</label>
          <input
            type="text"
            inputMode="decimal"
            value={lngText}
            onChange={(e) => {
              setLngText(e.target.value);
              setTouched(true);
              syncMarkerFromText(latText, e.target.value);
            }}
            placeholder="e.g. 78.473800"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {touched && (
        <p className="mt-2 text-xs text-emerald-700">
          Pin set manually — this exact spot will be saved and won&rsquo;t be overwritten by automatic locality
          lookups, even if you change the locality above.
        </p>
      )}
      {/* No `name` until touched, so an untouched picker submits nothing and
          the server keeps its existing auto-geocode behavior. */}
      <input type="hidden" name={touched ? "latitude" : undefined} value={latText} />
      <input type="hidden" name={touched ? "longitude" : undefined} value={lngText} />
    </div>
  );
}
