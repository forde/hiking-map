import React, { useRef, useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  MapView as MLMapView,
  Camera,
  UserLocation,
  setConnected,
  type MapViewRef,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { IconButton } from "react-native-paper";
import { useMapStore } from "../../stores/mapStore";
import { useLocation } from "../../hooks/useLocation";

// Call once at module level, not in render
setConnected(true);

export default function HikeMapView() {
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const {
    center,
    zoom,
    mapSource,
    followUser,
    headingEnabled,
    setFollowUser,
    setCenter,
    toggleHeading,
  } = useMapStore();
  const {
    coordinates,
    heading,
    hasPermission,
    requestPermissionAndLocate,
    startWatching,
  } = useLocation();
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  // On first map load, lazily request location and center on user
  const handleMapReady = useCallback(async () => {
    if (initialLocationSet) return;
    const coords = await requestPermissionAndLocate();
    if (coords) {
      setCenter(coords);
      setFollowUser(true);
      setInitialLocationSet(true);
      startWatching();
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: 14,
        animationDuration: 1000,
      });
    } else {
      setInitialLocationSet(true);
    }
  }, [
    initialLocationSet,
    requestPermissionAndLocate,
    setCenter,
    setFollowUser,
    startWatching,
  ]);

  // When following user and coordinates update, keep camera centered
  useEffect(() => {
    if (followUser && coordinates && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: coordinates,
        heading: headingEnabled && heading != null ? heading : 0,
        animationDuration: 500,
      });
    }
  }, [coordinates, heading, followUser, headingEnabled]);

  // Center-on-me FAB handler
  const handleCenterOnMe = useCallback(async () => {
    if (hasPermission === false || hasPermission === null) {
      const coords = await requestPermissionAndLocate();
      if (coords) {
        startWatching();
        setFollowUser(true);
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: 14,
          animationDuration: 1000,
        });
      }
      return;
    }

    if (coordinates) {
      setFollowUser(true);
      cameraRef.current?.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: 14,
        heading: headingEnabled && heading != null ? heading : 0,
        animationDuration: 1000,
      });
    }
  }, [
    hasPermission,
    coordinates,
    heading,
    headingEnabled,
    requestPermissionAndLocate,
    startWatching,
    setFollowUser,
  ]);

  // Disable follow mode when user manually pans the map
  const handleRegionWillChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, { isUserInteraction: boolean }>) => {
      if (feature.properties?.isUserInteraction && followUser) {
        setFollowUser(false);
      }
    },
    [followUser, setFollowUser],
  );

  const mapStyle = {
    version: 8 as const,
    sources: {
      "raster-tiles": {
        type: "raster" as const,
        tiles: [mapSource.url],
        tileSize: mapSource.tileSize,
        attribution: mapSource.attribution,
      },
    },
    layers: [
      {
        id: "raster-layer",
        type: "raster" as const,
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <MLMapView
        ref={mapRef}
        style={styles.map}
        mapStyle={JSON.stringify(mapStyle)}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, left: 8 }}
        onDidFinishLoadingMap={handleMapReady}
        onRegionWillChange={handleRegionWillChange}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
        />
        {hasPermission && (
          <UserLocation
            visible={true}
            animated={true}
            showsUserHeadingIndicator={headingEnabled}
          />
        )}
      </MLMapView>

      {/* FAB area — bottom right */}
      <View style={styles.fabContainer}>
        {/* Compass lock / heading toggle */}
        <IconButton
          icon={headingEnabled ? "compass" : "compass-off"}
          mode="contained"
          size={22}
          onPress={toggleHeading}
          style={styles.fab}
          iconColor="#2E7D32"
          containerColor="white"
        />
        {/* Center on me */}
        <IconButton
          icon={followUser ? "crosshairs-gps" : "crosshairs"}
          mode="contained"
          size={22}
          onPress={handleCenterOnMe}
          style={styles.fab}
          iconColor="#2E7D32"
          containerColor="white"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: 100,
    right: 16,
    gap: 8,
    alignItems: "center",
  },
  fab: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
