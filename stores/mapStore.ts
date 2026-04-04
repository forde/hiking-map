import { create } from 'zustand';
import { DEFAULT_MAP_SOURCE, type MapSource } from '../constants/mapSources';

interface MapState {
  center: [number, number]; // [lng, lat]
  zoom: number;
  mapSource: MapSource;
  followUser: boolean;
  headingEnabled: boolean; // rotate map with compass heading
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setMapSource: (source: MapSource) => void;
  setFollowUser: (follow: boolean) => void;
  toggleHeading: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [21.0122, 52.2297], // Warsaw fallback
  zoom: 11,
  mapSource: DEFAULT_MAP_SOURCE,
  followUser: false,
  headingEnabled: false,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setMapSource: (mapSource) => set({ mapSource }),
  setFollowUser: (followUser) => set({ followUser }),
  toggleHeading: () => set((s) => ({ headingEnabled: !s.headingEnabled })),
}));
