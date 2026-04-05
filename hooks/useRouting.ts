import { useEffect, useRef } from 'react';
import { useRouteStore } from '../stores/routeStore';
import { fetchORSRoute } from '../services/ors';
import { calculateDifficulty } from '../utils/difficulty';
import { polylineDistanceKm } from '../utils/geo';

const DEBOUNCE_MS = 800;

/** Cache key from two coordinate pairs */
function segmentKey(a: [number, number], b: [number, number]): string {
  return `${a[0]},${a[1]}|${b[0]},${b[1]}`;
}

interface CachedSegment {
  polyline: [number, number][];
  isFallback: boolean;
}

export function useRouting(): void {
  const waypoints = useRouteStore((s) => s.waypoints);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(0);
  const cacheRef = useRef<Map<string, CachedSegment>>(new Map());

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const store = useRouteStore.getState();

    if (waypoints.length < 2) {
      store.setIsRouting(false);
      cacheRef.current.clear();
      return;
    }

    // Clear stale polyline immediately so the old path doesn't linger
    store.setRouteResult({
      polyline: [],
      distanceKm: 0,
      elevationGainM: 0,
      elevationLossM: 0,
      estimatedTimeMin: 0,
      difficulty: 'easy',
    });
    store.setRoutingError(null);
    store.setIsRouting(true);
    const currentVersion = ++versionRef.current;

    debounceRef.current = setTimeout(async () => {
      const coords = waypoints.map((w) => w.coordinates);
      const cache = cacheRef.current;

      // Build segment keys and identify which need fetching
      const keys: string[] = [];
      const fetchPromises: Map<string, Promise<CachedSegment>> = new Map();

      for (let i = 0; i < coords.length - 1; i++) {
        const key = segmentKey(coords[i], coords[i + 1]);
        keys.push(key);

        if (!cache.has(key) && !fetchPromises.has(key)) {
          const pair = [coords[i], coords[i + 1]] as [number, number][];
          fetchPromises.set(
            key,
            fetchORSRoute(pair).then((result): CachedSegment => {
              if (result) {
                return { polyline: result.polyline, isFallback: false };
              }
              return { polyline: pair, isFallback: true };
            }),
          );
        }
      }

      // Fetch only uncached segments
      if (fetchPromises.size > 0) {
        const entries = Array.from(fetchPromises.entries());
        const results = await Promise.all(entries.map(([, p]) => p));
        for (let i = 0; i < entries.length; i++) {
          cache.set(entries[i][0], results[i]);
        }
      }

      // Discard if waypoints changed during the requests
      if (versionRef.current !== currentVersion) return;

      // Prune cache — remove entries not in current keys
      const currentKeys = new Set(keys);
      for (const k of cache.keys()) {
        if (!currentKeys.has(k)) cache.delete(k);
      }

      // Stitch segments from cache
      const fullPolyline: [number, number][] = [];
      let hasFallback = false;

      for (const key of keys) {
        const segment = cache.get(key)!;
        if (segment.isFallback) hasFallback = true;
        const start = fullPolyline.length > 0 ? 1 : 0;
        for (let j = start; j < segment.polyline.length; j++) {
          fullPolyline.push(segment.polyline[j]);
        }
      }

      const distanceKm = polylineDistanceKm(fullPolyline);
      const { timeMin, difficulty } = calculateDifficulty(distanceKm, 0);

      const state = useRouteStore.getState();
      state.setRouteResult({
        polyline: fullPolyline,
        distanceKm,
        elevationGainM: 0,
        elevationLossM: 0,
        estimatedTimeMin: timeMin,
        difficulty,
      });

      if (hasFallback) {
        state.setRoutingError(
          'Trail snapping unavailable for some segments',
        );
      }

      state.setIsRouting(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [waypoints]);
}
