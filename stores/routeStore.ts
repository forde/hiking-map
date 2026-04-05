import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Difficulty } from '../utils/difficulty';

export type WaypointType = 'regular' | 'destination';

export interface Waypoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  type: WaypointType;
  name?: string;
  elevation?: number;
}

export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  polyline: [number, number][];
  elevationProfile: number[];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  estimatedTimeMin: number;
  difficulty: Difficulty;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface RouteResult {
  polyline: [number, number][];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  estimatedTimeMin: number;
  difficulty: Difficulty;
}

interface RouteState {
  waypoints: Waypoint[];
  polyline: [number, number][];
  elevationProfile: number[];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  estimatedTimeMin: number;
  difficulty: Difficulty | null;
  isRouting: boolean;
  routingError: string | null;
  activeWaypointId: string | null;

  addWaypoint: (coordinate: [number, number]) => void;
  removeWaypoint: (id: string) => void;
  updateWaypointPosition: (id: string, coordinate: [number, number]) => void;
  updateWaypointType: (id: string, type: WaypointType) => void;
  setActiveWaypointId: (id: string | null) => void;
  setRouteResult: (result: RouteResult) => void;
  setIsRouting: (routing: boolean) => void;
  setRoutingError: (error: string | null) => void;
  clearRoute: () => void;
}

const initialState = {
  waypoints: [] as Waypoint[],
  polyline: [] as [number, number][],
  elevationProfile: [] as number[],
  distanceKm: 0,
  elevationGainM: 0,
  elevationLossM: 0,
  estimatedTimeMin: 0,
  difficulty: null as Difficulty | null,
  isRouting: false,
  routingError: null as string | null,
  activeWaypointId: null as string | null,
};

export const useRouteStore = create<RouteState>((set) => ({
  ...initialState,

  addWaypoint: (coordinate) =>
    set((s) => ({
      waypoints: [
        ...s.waypoints,
        {
          id: Crypto.randomUUID(),
          coordinates: coordinate,
          type: 'regular',
        },
      ],
    })),

  removeWaypoint: (id) =>
    set((s) => {
      const waypoints = s.waypoints.filter((w) => w.id !== id);
      if (waypoints.length < 2) {
        return {
          waypoints,
          polyline: [],
          distanceKm: 0,
          elevationGainM: 0,
          elevationLossM: 0,
          estimatedTimeMin: 0,
          difficulty: null,
          routingError: null,
        };
      }
      return { waypoints };
    }),

  updateWaypointPosition: (id, coordinate) =>
    set((s) => ({
      waypoints: s.waypoints.map((w) =>
        w.id === id ? { ...w, coordinates: coordinate } : w,
      ),
    })),

  updateWaypointType: (id, type) =>
    set((s) => ({
      waypoints: s.waypoints.map((w) =>
        w.id === id ? { ...w, type } : w,
      ),
    })),

  setActiveWaypointId: (id) => set({ activeWaypointId: id }),

  setRouteResult: (result) =>
    set({
      polyline: result.polyline,
      distanceKm: result.distanceKm,
      elevationGainM: result.elevationGainM,
      elevationLossM: result.elevationLossM,
      estimatedTimeMin: result.estimatedTimeMin,
      difficulty: result.difficulty,
      routingError: null,
    }),

  setIsRouting: (isRouting) => set({ isRouting }),

  setRoutingError: (routingError) => set({ routingError }),

  clearRoute: () => set(initialState),
}));
