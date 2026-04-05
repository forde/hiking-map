import React, { useMemo, useState, useCallback } from "react";
import { StyleSheet, View, Text, Pressable, useColorScheme } from "react-native";
import { Portal, Dialog, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouteStore } from "../../stores/routeStore";
import { formatDuration } from "../../utils/geo";
import { polylineDistanceKm } from "../../utils/geo";
import { calculateDifficulty } from "../../utils/difficulty";
import type { Difficulty } from "../../utils/difficulty";

const hasGlass = isLiquidGlassAvailable();

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#4CAF50",
  moderate: "#FFC107",
  hard: "#FF9800",
  demanding: "#F44336",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  demanding: "Demanding",
};

export default function RouteInfoChip() {
  const waypoints = useRouteStore((s) => s.waypoints);
  const polyline = useRouteStore((s) => s.polyline);
  const distanceKm = useRouteStore((s) => s.distanceKm);
  const estimatedTimeMin = useRouteStore((s) => s.estimatedTimeMin);
  const difficulty = useRouteStore((s) => s.difficulty);
  const isRouting = useRouteStore((s) => s.isRouting);
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  // Search bar: top = insets.top + 8, height = 48, gap = 8
  const chipTop = insets.top + 8 + 48 + 8;

  // Compute distance/time to next destination waypoint
  const destinationInfo = useMemo(() => {
    const firstDestIdx = waypoints.findIndex((w) => w.type === "destination");
    if (firstDestIdx < 1 || polyline.length < 2) return null;

    // Find the polyline segment closest to the destination waypoint
    const destCoord = waypoints[firstDestIdx].coordinates;

    // Approximate: sum polyline distance up to the point nearest to destination
    let minDist = Infinity;
    let nearestIdx = 0;
    for (let i = 0; i < polyline.length; i++) {
      const dx = polyline[i][0] - destCoord[0];
      const dy = polyline[i][1] - destCoord[1];
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    const segmentToDestination = polyline.slice(0, nearestIdx + 1);
    if (segmentToDestination.length < 2) return null;

    const destDistKm = polylineDistanceKm(segmentToDestination);
    const { timeMin } = calculateDifficulty(destDistKm, 0);

    return {
      distanceKm: destDistKm,
      timeMin,
    };
  }, [waypoints, polyline]);

  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleClearRoute = useCallback(() => {
    useRouteStore.getState().clearRoute();
    setConfirmVisible(false);
  }, []);

  if (waypoints.length < 2 || !difficulty) return null;

  const textColor = isDark ? "#fff" : "#1a1a1a";
  const subtextColor = isDark ? "#ccc" : "#555";

  const content = (
    <View style={styles.content}>
      <View style={styles.mainRow}>
        <View
          style={[
            styles.difficultyDot,
            { backgroundColor: DIFFICULTY_COLORS[difficulty] },
          ]}
        />
        <Text
          style={[
            styles.difficultyText,
            { color: DIFFICULTY_COLORS[difficulty] },
          ]}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Text>
        <Text style={[styles.stats, { color: textColor }]}>
          {distanceKm.toFixed(1)} km / {formatDuration(estimatedTimeMin)}
        </Text>
        <Pressable
          onPress={() => setConfirmVisible(true)}
          style={styles.clearButton}
          hitSlop={8}
        >
          <Icon name="close-thick" size={18} color="#E53935" />
        </Pressable>
      </View>
      {destinationInfo && (
        <Text style={[styles.destinationText, { color: subtextColor }]}>
          {destinationInfo.distanceKm.toFixed(1)} km /{" "}
          {formatDuration(destinationInfo.timeMin)} to destination
        </Text>
      )}
      {isRouting && (
        <Text style={[styles.routingText, { color: subtextColor }]}>
          Calculating route…
        </Text>
      )}
    </View>
  );

  const positionStyle = { top: chipTop };

  const confirmDialog = (
    <Portal>
      <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
        <Dialog.Title>Clear route?</Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: isDark ? "#ccc" : "#333" }}>
            This will remove all waypoints and the route from the map.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
          <Button onPress={handleClearRoute} textColor="#E53935">
            Clear
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  if (hasGlass) {
    return (
      <>
        <GlassView style={[styles.chip, positionStyle]}>{content}</GlassView>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <View
        style={[
          styles.chip,
          positionStyle,
          {
            backgroundColor: isDark ? "#2a2a2a" : "white",
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          },
        ]}
      >
        {content}
      </View>
      {confirmDialog}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 9,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 2,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "700",
  },
  stats: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  destinationText: {
    fontSize: 14,
  },
  routingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
