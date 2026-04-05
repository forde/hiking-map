import React, { useMemo } from "react";
import { ShapeSource, LineLayer } from "@maplibre/maplibre-react-native";
import { useRouteStore } from "../../stores/routeStore";
import WaypointMarker from "./WaypointMarker";

const EMPTY_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [] as GeoJSON.Feature[],
};

export default function RouteOverlay() {
  const waypoints = useRouteStore((s) => s.waypoints);
  const polyline = useRouteStore((s) => s.polyline);

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
    </>
  );
}
