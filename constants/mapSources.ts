export interface MapSource {
  id: string;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  tileSize: number;
  attribution?: string;
}

export const MAP_SOURCES: MapSource[] = [
  {
    id: 'mapa-turystyczna',
    name: 'Mapa Turystyczna',
    url: 'https://mapa-turystyczna.pl/tiles/{z}/{x}/{y}.png',
    type: 'raster',
    tileSize: 256,
    attribution: '© mapa-turystyczna.pl',
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    type: 'raster',
    tileSize: 256,
    attribution: '© OpenTopoMap contributors',
  },
  {
    id: 'thunderforest-outdoors',
    name: 'Thunderforest Outdoors',
    url: 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}',
    type: 'raster',
    tileSize: 256,
    attribution: '© Thunderforest',
  },
  {
    id: 'openfreemap',
    name: 'OpenFreeMap',
    url: 'https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf',
    type: 'vector',
    tileSize: 512,
    attribution: '© OpenFreeMap contributors',
  },
  {
    id: 'mapy-cz',
    name: 'Mapy.cz',
    url: 'https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}',
    type: 'raster',
    tileSize: 256,
    attribution: '© Mapy.cz',
  },
];

export const DEFAULT_MAP_SOURCE = MAP_SOURCES[0];
