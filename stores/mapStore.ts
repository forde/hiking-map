import { create } from 'zustand';
import { getPrimarySource, type MapSource } from '../constants/mapSources';

interface MapState {
  center: [number, number]; // [lng, lat]
  zoom: number;
  mapSource: MapSource;
  followUser: boolean;
  headingEnabled: boolean;
  showHikingOverlay: boolean;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setMapSource: (source: MapSource) => void;
  setFollowUser: (follow: boolean) => void;
  toggleHeading: () => void;
  toggleHikingOverlay: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [21.0122, 52.2297], // Warsaw fallback
  zoom: 11,
  mapSource: getPrimarySource(),
  followUser: false,
  headingEnabled: false,
  showHikingOverlay: true,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setMapSource: (mapSource) => set({ mapSource }),
  setFollowUser: (followUser) => set({ followUser }),
  toggleHeading: () => set((s) => ({ headingEnabled: !s.headingEnabled })),
  toggleHikingOverlay: () =>
    set((s) => ({ showHikingOverlay: !s.showHikingOverlay })),
}));
