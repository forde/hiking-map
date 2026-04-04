import { create } from 'zustand';
import { DEFAULT_MAP_SOURCE, type MapSource } from '../constants/mapSources';

interface MapState {
  center: [number, number]; // [lng, lat]
  zoom: number;
  mapSource: MapSource;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setMapSource: (source: MapSource) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [21.0122, 52.2297], // Warsaw
  zoom: 11,
  mapSource: DEFAULT_MAP_SOURCE,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setMapSource: (mapSource) => set({ mapSource }),
}));
