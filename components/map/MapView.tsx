import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  MapView as MLMapView,
  Camera,
  setConnected,
  type MapViewRef,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { useMapStore } from '../../stores/mapStore';

setConnected(true);

export default function HikeMapView() {
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const { center, zoom, mapSource } = useMapStore();

  const mapStyle = {
    version: 8 as const,
    sources: {
      'raster-tiles': {
        type: 'raster' as const,
        tiles: [mapSource.url],
        tileSize: mapSource.tileSize,
        attribution: mapSource.attribution,
      },
    },
    layers: [
      {
        id: 'raster-layer',
        type: 'raster' as const,
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  return (
    <MLMapView
      ref={mapRef}
      style={styles.map}
      mapStyle={JSON.stringify(mapStyle)}
      logoEnabled={false}
      attributionEnabled={true}
      attributionPosition={{ bottom: 8, left: 8 }}
    >
      <Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: center,
          zoomLevel: zoom,
        }}
      />
    </MLMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
