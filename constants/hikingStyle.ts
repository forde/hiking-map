/**
 * Custom MapLibre GL style for Protomaps vector tiles with hiking aesthetics.
 *
 * Renders the Protomaps basemap (earth, water, landcover, roads, buildings,
 * places, pois) in a style inspired by topographic hiking maps: green forest
 * fills, prominent paths/trails, muted roads, terrain-friendly palette.
 *
 * Trail colour-coding (sac_scale, osmc:symbol) is NOT available in the standard
 * Protomaps schema — the Waymarked Trails raster overlay handles that separately.
 */

import { HIKING_TRAILS_OVERLAY } from './mapSources';

interface StyleJSON {
  version: 8;
  sources: Record<string, unknown>;
  layers: unknown[];
  glyphs?: string;
}

/**
 * Build a complete MapLibre style for the Protomaps vector source.
 * @param tileUrl - The vector tile URL template, e.g. "https://tiles.example.com/{z}/{x}/{y}.pbf"
 * @param options.showHikingOverlay - Whether to include the Waymarked Trails raster layer
 */
export function buildHikingStyle(
  tileUrl: string,
  options: { showHikingOverlay: boolean } = { showHikingOverlay: true },
): StyleJSON {
  const sources: Record<string, unknown> = {
    protomaps: {
      type: 'vector',
      tiles: [tileUrl],
      maxzoom: 15,
      attribution: '© OpenStreetMap contributors, Protomaps',
    },
  };

  if (options.showHikingOverlay) {
    sources['hiking-overlay'] = {
      type: 'raster',
      tiles: [HIKING_TRAILS_OVERLAY.url],
      tileSize: HIKING_TRAILS_OVERLAY.tileSize,
      maxzoom: HIKING_TRAILS_OVERLAY.maxZoom,
      attribution: HIKING_TRAILS_OVERLAY.attribution,
    };
  }

  const layers: unknown[] = [
    // ── Background ──
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f5f3ef' },
    },

    // ── Earth ──
    {
      id: 'earth',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'earth',
      paint: { 'fill-color': '#f5f3ef' },
    },

    // ── Water (polygons) ──
    {
      id: 'water',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'water',
      paint: { 'fill-color': '#a3cde2' },
    },

    // ── Landcover ──
    {
      id: 'landcover-forest',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landcover',
      filter: ['==', 'kind', 'forest'],
      paint: { 'fill-color': '#c8e6c0', 'fill-opacity': 0.7 },
    },
    {
      id: 'landcover-grassland',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landcover',
      filter: ['in', 'kind', 'grassland', 'farmland'],
      paint: { 'fill-color': '#e2efc8', 'fill-opacity': 0.5 },
    },
    {
      id: 'landcover-scrub',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landcover',
      filter: ['==', 'kind', 'scrub'],
      paint: { 'fill-color': '#d4e4b8', 'fill-opacity': 0.5 },
    },
    {
      id: 'landcover-glacier',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landcover',
      filter: ['==', 'kind', 'glacier'],
      paint: { 'fill-color': '#e8f0f8', 'fill-opacity': 0.8 },
    },
    {
      id: 'landcover-barren',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landcover',
      filter: ['==', 'kind', 'barren'],
      paint: { 'fill-color': '#e8e4da', 'fill-opacity': 0.4 },
    },

    // ── Landuse ──
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landuse',
      filter: ['in', 'kind', 'park', 'nature_reserve', 'national_park', 'forest'],
      paint: { 'fill-color': '#d1ecc8', 'fill-opacity': 0.4 },
    },
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landuse',
      filter: ['==', 'kind', 'residential'],
      paint: { 'fill-color': '#ece7e0', 'fill-opacity': 0.4 },
    },
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landuse',
      filter: ['in', 'kind', 'industrial', 'commercial'],
      paint: { 'fill-color': '#e0dbd3', 'fill-opacity': 0.3 },
    },

    // ── Boundaries ──
    {
      id: 'boundaries-country',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'boundaries',
      filter: ['==', 'kind', 'country'],
      paint: {
        'line-color': '#9e8e7e',
        'line-width': 1.5,
        'line-dasharray': [4, 2],
      },
    },

    // ── Buildings ──
    {
      id: 'buildings',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'buildings',
      minzoom: 14,
      paint: {
        'fill-color': '#ddd8d0',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.3, 16, 0.6],
      },
    },

    // ── Roads — casings (outlines) for major roads ──
    {
      id: 'roads-highway-casing',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'highway'],
      paint: {
        'line-color': '#c88040',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 12, 4, 16, 10],
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },

    // ── Roads — fills ──
    {
      id: 'roads-highway',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'highway'],
      paint: {
        'line-color': '#e8a850',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 3, 16, 8],
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
    {
      id: 'roads-major',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'major_road'],
      paint: {
        'line-color': '#d4c4a0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 2, 16, 6],
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },
    {
      id: 'roads-minor',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'minor_road'],
      paint: {
        'line-color': '#e0d8c8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 14, 1.5, 16, 4],
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    },

    // ── Paths & trails — prominent for hiking ──
    {
      id: 'roads-path-track',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: [
        'all',
        ['==', 'kind', 'path'],
        ['in', 'kind_detail', 'track', 'bridleway'],
      ],
      paint: {
        'line-color': '#a08060',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.8, 16, 2.5],
        'line-dasharray': [4, 2],
      },
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
    },
    {
      id: 'roads-path-foot',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: [
        'all',
        ['==', 'kind', 'path'],
        ['in', 'kind_detail', 'path', 'footway', 'pedestrian'],
      ],
      paint: {
        'line-color': '#c06040',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 16, 2],
        'line-dasharray': [2, 2],
      },
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
    },
    {
      id: 'roads-path-steps',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['all', ['==', 'kind', 'path'], ['==', 'kind_detail', 'steps']],
      paint: {
        'line-color': '#c06040',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1, 16, 2.5],
        'line-dasharray': [1, 1],
      },
    },
    {
      id: 'roads-path-cycleway',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['all', ['==', 'kind', 'path'], ['==', 'kind_detail', 'cycleway']],
      paint: {
        'line-color': '#4080c0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 1.5],
        'line-dasharray': [3, 2],
      },
    },

    // ── Rail ──
    {
      id: 'roads-rail',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'rail'],
      paint: {
        'line-color': '#999',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 1.5],
        'line-dasharray': [6, 4],
      },
    },

    // ── Aerialway (ski lifts, cable cars) ──
    {
      id: 'roads-aerialway',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'kind', 'aerialway'],
      minzoom: 12,
      paint: {
        'line-color': '#666',
        'line-width': 1.5,
        'line-dasharray': [8, 4],
      },
    },

    // ── Hiking overlay (Waymarked Trails raster) ──
    ...(options.showHikingOverlay
      ? [
          {
            id: 'hiking-trails-layer',
            type: 'raster',
            source: 'hiking-overlay',
            minzoom: 0,
            maxzoom: HIKING_TRAILS_OVERLAY.maxZoom,
          },
        ]
      : []),

    // ── Place labels ──
    {
      id: 'places-country',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['==', 'kind', 'country'],
      minzoom: 2,
      maxzoom: 6,
      layout: {
        'text-field': '{name}',
        'text-size': 14,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
      },
      paint: {
        'text-color': '#5a4e42',
        'text-halo-color': 'rgba(255,255,255,0.8)',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'places-city',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['all', ['==', 'kind', 'locality'], ['==', 'kind_detail', 'city']],
      minzoom: 5,
      maxzoom: 14,
      layout: {
        'text-field': '{name}',
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 16],
      },
      paint: {
        'text-color': '#3a3a3a',
        'text-halo-color': 'rgba(255,255,255,0.85)',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'places-town',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['all', ['==', 'kind', 'locality'], ['==', 'kind_detail', 'town']],
      minzoom: 8,
      layout: {
        'text-field': '{name}',
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 13, 14],
      },
      paint: {
        'text-color': '#4a4a4a',
        'text-halo-color': 'rgba(255,255,255,0.85)',
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'places-village',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: [
        'all',
        ['==', 'kind', 'locality'],
        ['in', 'kind_detail', 'village', 'hamlet'],
      ],
      minzoom: 11,
      layout: {
        'text-field': '{name}',
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 15, 13],
      },
      paint: {
        'text-color': '#5a5a5a',
        'text-halo-color': 'rgba(255,255,255,0.85)',
        'text-halo-width': 1,
      },
    },

    // ── POIs — hiking-relevant only ──
    {
      id: 'pois-peaks',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'pois',
      filter: ['==', 'kind', 'peak'],
      minzoom: 11,
      layout: {
        'text-field': '{name}',
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'icon-image': '',
      },
      paint: {
        'text-color': '#8b4513',
        'text-halo-color': 'rgba(255,255,255,0.8)',
        'text-halo-width': 1,
      },
    },
    {
      id: 'pois-shelter',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'pois',
      filter: ['in', 'kind', 'shelter', 'alpine_hut', 'wilderness_hut', 'camp_site'],
      minzoom: 13,
      layout: {
        'text-field': '{name}',
        'text-size': 10,
        'text-offset': [0, 1],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#2E7D32',
        'text-halo-color': 'rgba(255,255,255,0.8)',
        'text-halo-width': 1,
      },
    },
    {
      id: 'pois-water',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'pois',
      filter: ['in', 'kind', 'spring', 'drinking_water', 'waterfall'],
      minzoom: 13,
      layout: {
        'text-field': '{name}',
        'text-size': 10,
        'text-offset': [0, 1],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#2874a6',
        'text-halo-color': 'rgba(255,255,255,0.8)',
        'text-halo-width': 1,
      },
    },

    // ── Water labels ──
    {
      id: 'water-labels',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'water',
      filter: ['has', 'name'],
      minzoom: 10,
      layout: {
        'text-field': '{name}',
        'text-size': 11,
        'symbol-placement': 'point',
      },
      paint: {
        'text-color': '#4a90b8',
        'text-halo-color': 'rgba(255,255,255,0.6)',
        'text-halo-width': 1,
      },
    },
  ];

  return {
    version: 8,
    sources,
    layers,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
  };
}
