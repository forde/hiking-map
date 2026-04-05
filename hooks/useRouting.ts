import { useEffect, useRef } from 'react';
import { useRouteStore } from '../stores/routeStore';
import { fetchValhallaRoute } from '../services/valhalla';
import { calculateDifficulty } from '../utils/difficulty';
import { polylineDistanceKm } from '../utils/geo';

const DEBOUNCE_MS = 800;

export function useRouting(): void {
  const waypoints = useRouteStore((s) => s.waypoints);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const store = useRouteStore.getState();

    if (waypoints.length < 2) {
      store.setIsRouting(false);
      return;
    }

    store.setIsRouting(true);
    const currentVersion = ++versionRef.current;

    debounceRef.current = setTimeout(async () => {
      const coords = waypoints.map((w) => w.coordinates);
      const result = await fetchValhallaRoute(coords);

      // Discard if waypoints changed during the request
      if (versionRef.current !== currentVersion) return;

      if (result) {
        const { timeMin, difficulty } = calculateDifficulty(
          result.distanceKm,
          0, // elevationGainM — deferred to Feature 4 (DEM sampling)
        );

        useRouteStore.getState().setRouteResult({
          polyline: result.polyline,
          distanceKm: result.distanceKm,
          elevationGainM: 0,
          elevationLossM: 0,
          estimatedTimeMin: timeMin,
          difficulty,
        });
      } else {
        // Straight-line fallback
        const fallbackPolyline = coords;
        const distanceKm = polylineDistanceKm(fallbackPolyline);
        const { timeMin, difficulty } = calculateDifficulty(distanceKm, 0);

        const state = useRouteStore.getState();
        state.setRouteResult({
          polyline: fallbackPolyline,
          distanceKm,
          elevationGainM: 0,
          elevationLossM: 0,
          estimatedTimeMin: timeMin,
          difficulty,
        });
        state.setRoutingError(
          'Route snapping unavailable — showing approximate path',
        );
      }

      useRouteStore.getState().setIsRouting(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [waypoints]);
}
