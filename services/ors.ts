const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY ?? '';
const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-hiking/geojson';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ORSRouteResult {
  polyline: [number, number][]; // [lng, lat][]
  distanceKm: number;
  timeSeconds: number;
}

export async function fetchORSRoute(
  coordinates: [number, number][],
): Promise<ORSRouteResult | null> {
  if (!ORS_API_KEY || coordinates.length < 2) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ORS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates,
        radiuses: coordinates.map(() => 350),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[ORS] ${response.status}: ${body}`);
      return null;
    }

    const data = await response.json();
    const feature = data?.features?.[0];
    if (!feature?.geometry?.coordinates?.length) return null;

    const polyline = feature.geometry.coordinates as [number, number][];
    const summary = feature.properties?.summary;

    return {
      polyline,
      distanceKm: summary?.distance != null ? summary.distance / 1000 : 0,
      timeSeconds: summary?.duration ?? 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
