import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Portal, Dialog, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import {
  useRouteStore,
  type WaypointType,
} from '../../stores/routeStore';

const hasGlass = isLiquidGlassAvailable();

const WAYPOINT_TYPES: { type: WaypointType; label: string; color: string }[] = [
  { type: 'start', label: 'Start', color: '#2E7D32' },
  { type: 'regular', label: 'Regular', color: '#E53935' },
  { type: 'destination', label: 'Destination', color: '#1E88E5' },
];

export default function WaypointPopup() {
  const activeWaypointId = useRouteStore((s) => s.activeWaypointId);
  const waypoints = useRouteStore((s) => s.waypoints);
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + 60;

  const [confirmVisible, setConfirmVisible] = useState(false);

  const waypoint = waypoints.find((w) => w.id === activeWaypointId);

  const handleTypeChange = useCallback(
    (type: WaypointType) => {
      if (activeWaypointId) {
        useRouteStore.getState().updateWaypointType(activeWaypointId, type);
      }
    },
    [activeWaypointId],
  );

  const handleRemove = useCallback(() => {
    setConfirmVisible(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (activeWaypointId) {
      useRouteStore.getState().removeWaypoint(activeWaypointId);
      useRouteStore.getState().setActiveWaypointId(null);
    }
    setConfirmVisible(false);
  }, [activeWaypointId]);

  const handleDismiss = useCallback(() => {
    useRouteStore.getState().setActiveWaypointId(null);
  }, []);

  if (!waypoint) return null;

  const content = (
    <View style={[styles.content, { paddingBottom: 20 + bottomOffset }]}>
      <Text variant="titleSmall" style={{ color: isDark ? '#fff' : '#1a1a1a' }}>
        Waypoint {waypoints.indexOf(waypoint) + 1}
      </Text>
      <View style={styles.buttonRow}>
        {WAYPOINT_TYPES.map(({ type, label, color }) => {
          const isActive = waypoint.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => handleTypeChange(type)}
              style={[
                styles.typeButton,
                {
                  backgroundColor: isActive ? color : isDark ? '#3a3a3a' : '#f0f0f0',
                  borderColor: isActive ? color : isDark ? '#555' : '#ddd',
                },
              ]}
            >
              <Icon
                name="map-marker"
                size={18}
                color={isActive ? '#fff' : isDark ? '#aaa' : '#666'}
              />
              <Text
                style={[
                  styles.typeLabel,
                  { color: isActive ? '#fff' : isDark ? '#aaa' : '#666' },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={handleRemove} style={styles.removeButton}>
          <Icon name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <Pressable style={styles.backdrop} onPress={handleDismiss} />
      {hasGlass ? (
        <GlassView style={styles.popup}>
          {content}
        </GlassView>
      ) : (
        <View
          style={[
            styles.popup,
            {
              backgroundColor: isDark ? '#2a2a2a' : 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
        >
          {content}
        </View>
      )}
      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>Remove waypoint?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: isDark ? '#ccc' : '#333' }}>
              This will remove waypoint {waypoints.indexOf(waypoint) + 1} from the route.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
            <Button onPress={handleConfirmRemove} textColor="#E53935">Remove</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  popup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 51,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
