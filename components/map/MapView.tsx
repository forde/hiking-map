import React, { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import {
  MapView as MLMapView,
  Camera,
  UserLocation,
  type MapViewRef,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { IconButton } from 'react-native-paper';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useMapStore } from '../../stores/mapStore';
import { useLocation } from '../../hooks/useLocation';
import { HIKING_TRAILS_OVERLAY } from '../../constants/mapSources';
import { buildHikingStyle } from '../../constants/hikingStyle';
import MapSourcePicker from './MapSourcePicker';
import ScaleBar from './ScaleBar';
import SearchPin from '../search/SearchPin';
import RouteOverlay from '../route/RouteOverlay';
import RouteInfoChip from '../route/RouteInfoChip';
import WaypointPopup from '../route/WaypointPopup';
import { useRouteStore } from '../../stores/routeStore';
import { AppTheme } from '../../constants/appTheme';

const hasGlass = isLiquidGlassAvailable();

/** Build an inline raster style for XYZ tile sources. */
function buildRasterStyle(
  url: string,
  tileSize: number,
  maxZoom: number,
  attribution: string,
  showHikingOverlay: boolean,
) {
  const sources: Record<string, unknown> = {
    'base-tiles': {
      type: 'raster' as const,
      tiles: [url],
      tileSize,
      maxzoom: maxZoom,
      attribution,
    },
  };

  const layers: unknown[] = [
    {
      id: 'base-layer',
      type: 'raster' as const,
      source: 'base-tiles',
      minzoom: 0,
      maxzoom: maxZoom,
    },
  ];

  if (showHikingOverlay) {
    sources['hiking-overlay'] = {
      type: 'raster' as const,
      tiles: [HIKING_TRAILS_OVERLAY.url],
      tileSize: HIKING_TRAILS_OVERLAY.tileSize,
      maxzoom: HIKING_TRAILS_OVERLAY.maxZoom,
      attribution: HIKING_TRAILS_OVERLAY.attribution,
    };
    layers.push({
      id: 'hiking-trails-layer',
      type: 'raster' as const,
      source: 'hiking-overlay',
      minzoom: 0,
      maxzoom: HIKING_TRAILS_OVERLAY.maxZoom,
    });
  }

  return { version: 8 as const, sources, layers };
}

export interface MapViewHandle {
  flyTo: (coordinate: [number, number], zoom?: number) => void;
}

interface MapViewProps {
  searchPin?: { coordinate: [number, number]; name: string } | null;
}

export default forwardRef<MapViewHandle, MapViewProps>(function HikeMapView(
  { searchPin },
  ref,
) {
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const {
    center,
    zoom,
    mapSource,
    followUser,
    headingEnabled,
    showHikingOverlay,
    setFollowUser,
    setCenter,
    setZoom,
    setMapSource,
    toggleHeading,
    toggleHikingOverlay,
  } = useMapStore();
  const {
    coordinates,
    heading,
    hasPermission,
    requestPermissionAndLocate,
    startWatching,
  } = useLocation();
  const isDark = useColorScheme() === 'dark';
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [sourcePickerVisible, setSourcePickerVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (coordinate: [number, number], zoom = 14) => {
      cameraRef.current?.setCamera({
        centerCoordinate: coordinate,
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    },
  }));

  // Track current map center latitude and zoom for the scale bar
  const [displayLatitude, setDisplayLatitude] = useState(center[1]);
  const [displayZoom, setDisplayZoom] = useState(zoom);

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
    (
      feature: GeoJSON.Feature<GeoJSON.Point, { isUserInteraction: boolean }>,
    ) => {
      if (feature.properties?.isUserInteraction && followUser) {
        setFollowUser(false);
      }
    },
    [followUser, setFollowUser],
  );

  // Update scale bar values when region changes
  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, { zoomLevel?: number }>) => {
      const coords = feature.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        setDisplayLatitude(coords[1]);
      }
      if (feature.properties?.zoomLevel != null) {
        setDisplayZoom(feature.properties.zoomLevel);
      }
    },
    [],
  );

  const handleLongPress = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Geometry>) => {
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      useRouteStore.getState().addWaypoint(coords);
    },
    [],
  );

  const mapStyle = useMemo(() => {
    if (mapSource.type === 'vector') {
      return buildHikingStyle(mapSource.url, { showHikingOverlay });
    }
    return buildRasterStyle(
      mapSource.url,
      mapSource.tileSize,
      mapSource.maxZoom,
      mapSource.attribution,
      showHikingOverlay,
    );
  }, [mapSource, showHikingOverlay]);

  return (
    <View style={styles.container}>
      <MLMapView
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, left: 8 }}
        onDidFinishLoadingMap={handleMapReady}
        onRegionWillChange={handleRegionWillChange}
        onRegionDidChange={handleRegionDidChange}
        onLongPress={handleLongPress}
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
        {searchPin && (
          <SearchPin
            coordinate={searchPin.coordinate}
            name={searchPin.name}
          />
        )}
        <RouteOverlay />
      </MLMapView>

      <ScaleBar latitude={displayLatitude} zoom={displayZoom} />

      <RouteInfoChip />
      <WaypointPopup />

      {/* FAB area — bottom right */}
      <View style={styles.fabContainer}>
        {hasGlass ? (
          <>
            <GlassView style={styles.glassFab} isInteractive>
              <IconButton
                icon="layers"
                size={22}
                onPress={() => setSourcePickerVisible(true)}
                iconColor={AppTheme.accentColor}
              />
            </GlassView>
            <GlassView style={styles.glassFab} isInteractive>
              <IconButton
                icon="walk"
                size={22}
                onPress={toggleHikingOverlay}
                iconColor={showHikingOverlay ? AppTheme.accentColor : AppTheme.mutedColor}
              />
            </GlassView>
            <GlassView style={styles.glassFab} isInteractive>
              <IconButton
                icon={headingEnabled ? 'compass' : 'compass-off'}
                size={22}
                onPress={toggleHeading}
                iconColor={AppTheme.accentColor}
              />
            </GlassView>
            <GlassView style={styles.glassFab} isInteractive>
              <IconButton
                icon={followUser ? 'crosshairs-gps' : 'crosshairs'}
                size={22}
                onPress={handleCenterOnMe}
                iconColor={AppTheme.accentColor}
              />
            </GlassView>
          </>
        ) : (
          <>
            <IconButton
              icon="layers"
              mode="contained"
              size={22}
              onPress={() => setSourcePickerVisible(true)}
              style={styles.fab}
              iconColor={AppTheme.accentColor}
              containerColor={isDark ? '#2a2a2a' : 'white'}
            />
            <IconButton
              icon="walk"
              mode="contained"
              size={22}
              onPress={toggleHikingOverlay}
              style={styles.fab}
              iconColor={showHikingOverlay ? AppTheme.accentColor : AppTheme.mutedColor}
              containerColor={isDark ? '#2a2a2a' : 'white'}
            />
            <IconButton
              icon={headingEnabled ? 'compass' : 'compass-off'}
              mode="contained"
              size={22}
              onPress={toggleHeading}
              style={styles.fab}
              iconColor={AppTheme.accentColor}
              containerColor={isDark ? '#2a2a2a' : 'white'}
            />
            <IconButton
              icon={followUser ? 'crosshairs-gps' : 'crosshairs'}
              mode="contained"
              size={22}
              onPress={handleCenterOnMe}
              style={styles.fab}
              iconColor={AppTheme.accentColor}
              containerColor={isDark ? '#2a2a2a' : 'white'}
            />
          </>
        )}
      </View>

      <MapSourcePicker
        visible={sourcePickerVisible}
        selected={mapSource}
        onSelect={setMapSource}
        onDismiss={() => setSourcePickerVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    gap: 8,
    alignItems: 'center',
  },
  fab: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  glassFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
});
