import Constants from 'expo-constants';

export interface MapSource {
  id: string;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  tileSize: number;
  maxZoom: number;
  attribution: string;
}

// Hiking trail overlay (transparent, rendered on top of any base map)
export const HIKING_TRAILS_OVERLAY: MapSource = {
  id: 'hiking-overlay',
  name: 'Hiking Trails',
  url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
  type: 'raster',
  tileSize: 256,
  maxZoom: 18,
  attribution: '© Waymarked Trails',
};

const protomapsR2Url =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_PROTOMAPS_R2_URL ??
  process.env.EXPO_PUBLIC_PROTOMAPS_R2_URL ??
  '';

const thunderforestApiKey =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_THUNDERFOREST_API_KEY ??
  process.env.EXPO_PUBLIC_THUNDERFOREST_API_KEY ??
  '';

/** Primary vector source — Protomaps PMTiles served via Cloudflare Worker on R2. */
const PROTOMAPS_SOURCE: MapSource | null = protomapsR2Url
  ? {
      id: 'protomaps',
      name: 'HikeMap (Vector)',
      url: `${protomapsR2Url}/{z}/{x}/{y}.pbf`,
      type: 'vector',
      tileSize: 512,
      maxZoom: 15,
      attribution: '© OpenStreetMap contributors, Protomaps',
    }
  : null;

/** Secondary raster XYZ sources — user-selectable alternatives. */
const RASTER_SOURCES: MapSource[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    type: 'raster',
    tileSize: 256,
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    type: 'raster',
    tileSize: 256,
    maxZoom: 17,
    attribution: '© OpenTopoMap contributors',
  },
  ...(thunderforestApiKey
    ? [
        {
          id: 'thunderforest-outdoors',
          name: 'Thunderforest Outdoors',
          url: `https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${thunderforestApiKey}`,
          type: 'raster' as const,
          tileSize: 256,
          maxZoom: 22,
          attribution: '© Thunderforest',
        },
      ]
    : []),
];

/** All available sources — primary vector first (when configured), then raster fallbacks. */
export const MAP_SOURCES: MapSource[] = [
  ...(PROTOMAPS_SOURCE ? [PROTOMAPS_SOURCE] : []),
  ...RASTER_SOURCES,
];

/** Returns vector PMTiles source when R2 URL is configured, otherwise first raster source. */
export function getPrimarySource(): MapSource {
  return PROTOMAPS_SOURCE ?? RASTER_SOURCES[0];
}

export const DEFAULT_MAP_SOURCE = getPrimarySource();
