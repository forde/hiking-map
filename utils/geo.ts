const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  a: [number, number],
  b: [number, number],
): number {
  const [lngA, latA] = a;
  const [lngB, latB] = b;

  const dLat = (latB - latA) * DEG_TO_RAD;
  const dLng = (lngB - lngA) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(latA * DEG_TO_RAD) * Math.cos(latB * DEG_TO_RAD) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function polylineDistanceKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1], coords[i]);
  }
  return total;
}

export function elevationStats(profile: number[]): {
  gainM: number;
  lossM: number;
} {
  let gainM = 0;
  let lossM = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i] - profile[i - 1];
    if (diff > 0) gainM += diff;
    else lossM += Math.abs(diff);
  }
  return { gainM, lossM };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}hr ${m}min` : `${h}hr`;
}
