import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  /** Current latitude of the map center (used for Mercator correction) */
  latitude: number;
  /** Current zoom level */
  zoom: number;
}

// At zoom 0, one pixel ≈ 156543.03 meters at the equator
const METERS_PER_PIXEL_Z0 = 156543.03;

const NICE_DISTANCES = [
  5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
];

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

export default function ScaleBar({ latitude, zoom }: Props) {
  const metersPerPixel =
    (METERS_PER_PIXEL_Z0 * Math.cos((latitude * Math.PI) / 180)) /
    Math.pow(2, zoom);

  // Target bar width ~80px, find nearest nice distance
  const targetMeters = metersPerPixel * 80;
  const niceDistance =
    NICE_DISTANCES.find((d) => d >= targetMeters) ??
    NICE_DISTANCES[NICE_DISTANCES.length - 1];
  const barWidth = Math.round(niceDistance / metersPerPixel);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{formatDistance(niceDistance)}</Text>
      <View style={[styles.bar, { width: barWidth }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 40,
    alignItems: "flex-start",
  },
  text: {
    fontSize: 11,
    color: "#333",
    fontWeight: "600",
    marginBottom: 2,
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  bar: {
    height: 3,
    backgroundColor: "#333",
    borderRadius: 1,
    borderWidth: 0,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});
