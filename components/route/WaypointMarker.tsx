import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { PointAnnotation } from '@maplibre/maplibre-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouteStore, type Waypoint } from '../../stores/routeStore';

const COLOR_MAP: Record<string, string> = {
  regular: '#E53935',
  destination: '#1E88E5',
};

interface WaypointMarkerProps {
  waypoint: Waypoint;
}

export default function WaypointMarker({ waypoint }: WaypointMarkerProps) {
  const color = COLOR_MAP[waypoint.type] ?? COLOR_MAP.regular;

  const handleDragEnd = useCallback(
    (event: GeoJSON.Feature<GeoJSON.Point>) => {
      const coords = event.geometry.coordinates as [number, number];
      useRouteStore.getState().updateWaypointPosition(waypoint.id, coords);
    },
    [waypoint.id],
  );

  const handlePress = useCallback(() => {
    useRouteStore.getState().setActiveWaypointId(waypoint.id);
  }, [waypoint.id]);

  return (
    <PointAnnotation
      id={`waypoint-${waypoint.id}`}
      coordinate={waypoint.coordinates}
      draggable={true}
      onDragEnd={handleDragEnd}
    >
      <Pressable onPress={handlePress}>
        <View style={styles.outline}>
          <Icon name="map-marker" size={32} color={color} />
        </View>
      </Pressable>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  outline: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
