import { useState, useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  coordinates: [number, number] | null; // [lng, lat]
  heading: number | null;
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coordinates: null,
    heading: null,
    hasPermission: null,
    isLoading: false,
    error: null,
  });
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const headingSubscription = useRef<Location.LocationSubscription | null>(null);

  const requestPermissionAndLocate = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          hasPermission: false,
          isLoading: false,
          error: 'Location permission denied',
        }));
        return null;
      }

      setState((prev) => ({ ...prev, hasPermission: true }));

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: [number, number] = [
        location.coords.longitude,
        location.coords.latitude,
      ];

      setState((prev) => ({
        ...prev,
        coordinates: coords,
        heading: location.coords.heading ?? null,
        isLoading: false,
      }));

      return coords;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get location';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  const startWatching = useCallback(async () => {
    if (watchSubscription.current) return;

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    watchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
      },
      (location) => {
        setState((prev) => ({
          ...prev,
          coordinates: [location.coords.longitude, location.coords.latitude],
        }));
      }
    );

    headingSubscription.current = await Location.watchHeadingAsync((heading) => {
      setState((prev) => ({
        ...prev,
        heading: heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading,
      }));
    });
  }, []);

  const stopWatching = useCallback(() => {
    watchSubscription.current?.remove();
    watchSubscription.current = null;
    headingSubscription.current?.remove();
    headingSubscription.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    requestPermissionAndLocate,
    startWatching,
    stopWatching,
  };
}
