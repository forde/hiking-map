import React, { useMemo } from "react";
import { StyleSheet, View, Text, useColorScheme } from "react-native";
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

  if (hasGlass) {
    return (
      <GlassView style={[styles.chip, positionStyle]}>{content}</GlassView>
    );
  }

  return (
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
  },
  destinationText: {
    fontSize: 14,
  },
  routingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
