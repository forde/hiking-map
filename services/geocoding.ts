export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  boundingbox: [string, string, string, string];
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'HikeMap/1.0 (app.hikemap)';

export async function searchPlaces(
  query: string,
): Promise<NominatimResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '8',
      'accept-language': 'pl,en',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) return [];

    const data: NominatimResult[] = await response.json();
    return data;
  } catch {
    return [];
  }
}
