/** Rough walking times from where you stay, good enough for "leave by" hints. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Old Town Square, used until the trip has its own base. */
export const DEFAULT_BASE: LatLng = { lat: 50.0875, lng: 14.4213 };

export const hasCoords = (it: { lat?: unknown; lng?: unknown } | null | undefined): it is LatLng =>
  !!it && typeof it.lat === "number" && typeof it.lng === "number";

export function baseOf(info?: { baseLat?: number | string; baseLng?: number | string } | null): LatLng {
  const lat = Number(info?.baseLat);
  const lng = Number(info?.baseLng);
  return lat && lng ? { lat, lng } : DEFAULT_BASE;
}

/**
 * Straight-line distance × 1.3 for street detours, at 4.8 km/h.
 * Returns null when the place has no coordinates.
 */
export function walkMinutes(it: { lat?: unknown; lng?: unknown }, base: LatLng = DEFAULT_BASE): number | null {
  if (!hasCoords(it)) return null;
  const r = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(r(it.lat - base.lat) / 2) ** 2 +
    Math.cos(r(base.lat)) * Math.cos(r(it.lat)) * Math.sin(r(it.lng - base.lng) / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));
  return Math.max(1, Math.round(((km * 1.3) / 4.8) * 60));
}
