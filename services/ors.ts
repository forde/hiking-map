const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY ?? '';
const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-hiking/geojson';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ORSRouteResult {
  polyline: [number, number][]; // [lng, lat][]
  distanceKm: number;
  timeSeconds: number;
  elevationProfile: number[]; // elevation in meters per coordinate
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
        elevation: true,
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

    // ORS returns [lng, lat, elevation_m] triplets when elevation: true
    const rawCoords = feature.geometry.coordinates as number[][];
    const polyline: [number, number][] = rawCoords.map(
      (c) => [c[0], c[1]] as [number, number],
    );
    const elevationProfile: number[] = rawCoords.map((c) => c[2] ?? 0);
    const summary = feature.properties?.summary;

    return {
      polyline,
      distanceKm: summary?.distance != null ? summary.distance / 1000 : 0,
      timeSeconds: summary?.duration ?? 0,
      elevationProfile,
    };
    // TODO Feature 8: when offline, elevation profile will be sampled
    // from locally downloaded Terrain-RGB DEM tiles instead of ORS API.
    // ORS elevation data is unavailable offline — elevationProfile will
    // be empty when routing falls back to straight-line mode.
    // ElevationPanel handles empty elevationProfile gracefully
    // (FAB hidden when profile is empty).
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
