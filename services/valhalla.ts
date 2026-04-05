const VALHALLA_URL = process.env.EXPO_PUBLIC_VALHALLA_URL ?? '';

const REQUEST_TIMEOUT_MS = 10_000;

export interface ValhallaRouteResult {
  polyline: [number, number][]; // [lng, lat][]
  distanceKm: number;
  timeSeconds: number;
}

/** Decode an encoded polyline string with the given precision (default 6 for Valhalla). */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const factor = Math.pow(10, precision);
  const coords: [number, number][] = [];
  let lat = 0;
  let lng = 0;
  let index = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / factor, lat / factor]); // [lng, lat] GeoJSON order
  }

  return coords;
}

export async function fetchValhallaRoute(
  coordinates: [number, number][],
): Promise<ValhallaRouteResult | null> {
  if (!VALHALLA_URL || coordinates.length < 2) return null;

  const locations = coordinates.map(([lng, lat], i, arr) => ({
    lon: lng,
    lat,
    type: (i === 0 || i === arr.length - 1 ? 'break' : 'through') as string,
  }));

  const body = {
    locations,
    costing: 'hiking',
    costing_options: {
      hiking: { use_trails: 1.0 },
    },
    units: 'kilometers',
    language: 'pl',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${VALHALLA_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const trip = data?.trip;
    if (!trip?.legs?.length) return null;

    // Combine all leg shapes into a single polyline
    const allCoords: [number, number][] = [];
    for (const leg of trip.legs) {
      if (leg.shape) {
        const decoded = decodePolyline(leg.shape);
        // Skip first point of subsequent legs (duplicate of previous leg's last)
        const start = allCoords.length > 0 ? 1 : 0;
        for (let i = start; i < decoded.length; i++) {
          allCoords.push(decoded[i]);
        }
      }
    }

    return {
      polyline: allCoords,
      distanceKm: trip.summary?.length ?? 0,
      timeSeconds: trip.summary?.time ?? 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
