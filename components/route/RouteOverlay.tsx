import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ShapeSource, LineLayer, PointAnnotation } from "@maplibre/maplibre-react-native";
import { useRouteStore } from "../../stores/routeStore";
import WaypointMarker from "./WaypointMarker";

const EMPTY_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [] as GeoJSON.Feature[],
};

export default function RouteOverlay() {
  const waypoints = useRouteStore((s) => s.waypoints);
  const polyline = useRouteStore((s) => s.polyline);
  const scrubIndex = useRouteStore((s) => s.scrubIndex);

  const scrubCoordinate = scrubIndex != null ? polyline[scrubIndex] : null;

  const routeGeoJSON = useMemo(() => {
    if (polyline.length < 2) return EMPTY_GEOJSON;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: polyline,
          },
          properties: {},
        },
      ],
    };
  }, [polyline]);

  return (
    <>
      <ShapeSource id="route-line-source" shape={routeGeoJSON}>
        <LineLayer
          id="route-line-outline"
          style={{
            lineColor: "#ffffff",
            lineWidth: 10,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <LineLayer
          id="route-line-layer"
          aboveLayerID="route-line-outline"
          style={{
            lineColor: "#E53935",
            lineWidth: 4,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </ShapeSource>
      {waypoints.map((wp) => (
        <WaypointMarker key={wp.id} waypoint={wp} />
      ))}
      {scrubCoordinate && (
        <PointAnnotation
          id="scrub-point"
          coordinate={scrubCoordinate}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={scrubStyles.dot} />
        </PointAnnotation>
      )}
    </>
  );
}

const scrubStyles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
});
