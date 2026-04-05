import React, { useMemo, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  useColorScheme,
  PanResponder,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouteStore } from "../../stores/routeStore";
import { elevationStats, distancesAlongPolyline } from "../../utils/geo";

const hasGlass = isLiquidGlassAvailable();
const PANEL_HEIGHT = 176;
const CHART_H_PAD = 16;
const CHART_TOP_PAD = 8;
const CHART_BOTTOM_PAD = 4;
const HEADER_HEIGHT = 32;
const GREEN = "#4CAF50";

interface Props {
  visible: boolean;
  top: number;
}

export default function ElevationPanel({ visible, top }: Props) {
  const liveProfile = useRouteStore((s) => s.elevationProfile);
  const scrubIndex = useRouteStore((s) => s.scrubIndex);
  const setScrubIndex = useRouteStore((s) => s.setScrubIndex);
  const isDark = useColorScheme() === "dark";

  // Keep showing the last valid profile during re-routing
  const lastProfileRef = useRef<number[]>(liveProfile);
  if (liveProfile.length >= 2) lastProfileRef.current = liveProfile;
  const elevationProfile = liveProfile.length >= 2 ? liveProfile : lastProfileRef.current;

  const chartWidthRef = useRef(0);

  const stats = useMemo(() => elevationStats(elevationProfile), [elevationProfile]);

  const chartHeight = PANEL_HEIGHT - HEADER_HEIGHT - CHART_TOP_PAD - CHART_BOTTOM_PAD - 10 - 14; // 10 top + 14 bottom padding

  const { pathD, fillD, minElev, maxElev } = useMemo(() => {
    if (elevationProfile.length < 2) {
      return { pathD: "", fillD: "", minElev: 0, maxElev: 0 };
    }
    const min = Math.min(...elevationProfile);
    const max = Math.max(...elevationProfile);
    const range = max - min || 1;
    const w = chartWidthRef.current || 300;
    const h = chartHeight;
    const n = elevationProfile.length;

    let line = "";
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = CHART_TOP_PAD + h - ((elevationProfile[i] - min) / range) * h;
      line += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }

    const fill = `${line} L${w},${CHART_TOP_PAD + h} L0,${CHART_TOP_PAD + h} Z`;
    return { pathD: line, fillD: fill, minElev: min, maxElev: max };
  }, [elevationProfile, chartHeight]);

  const yLabels = useMemo(() => {
    if (minElev === maxElev) return [];
    const mid = Math.round((minElev + maxElev) / 2);
    return [
      { value: Math.round(maxElev), y: CHART_TOP_PAD },
      { value: mid, y: CHART_TOP_PAD + chartHeight / 2 },
      { value: Math.round(minElev), y: CHART_TOP_PAD + chartHeight },
    ];
  }, [minElev, maxElev, chartHeight]);

  const indexFromX = useCallback(
    (x: number) => {
      const w = chartWidthRef.current;
      if (w <= 0 || elevationProfile.length < 2) return null;
      const ratio = Math.max(0, Math.min(1, x / w));
      return Math.round(ratio * (elevationProfile.length - 1));
    },
    [elevationProfile],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const idx = indexFromX(e.nativeEvent.locationX);
        setScrubIndex(idx);
      },
      onPanResponderMove: (e) => {
        const idx = indexFromX(e.nativeEvent.locationX);
        setScrubIndex(idx);
      },
      onPanResponderRelease: () => {
        setScrubIndex(null);
      },
      onPanResponderTerminate: () => {
        setScrubIndex(null);
      },
    }),
  ).current;

  // Recompute panResponder callbacks when dependencies change
  React.useEffect(() => {
    const handler = (e: { nativeEvent: { locationX: number } }) => {
      const idx = indexFromX(e.nativeEvent.locationX);
      setScrubIndex(idx);
    };
    panResponder.panHandlers.onResponderGrant = handler as any;
    panResponder.panHandlers.onResponderMove = handler as any;
  }, [indexFromX, setScrubIndex, panResponder]);

  const onChartLayout = useCallback((e: LayoutChangeEvent) => {
    chartWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const scrubX = useMemo(() => {
    if (scrubIndex == null || elevationProfile.length < 2) return null;
    const w = chartWidthRef.current || 300;
    return (scrubIndex / (elevationProfile.length - 1)) * w;
  }, [scrubIndex, elevationProfile]);

  const scrubY = useMemo(() => {
    if (scrubIndex == null || elevationProfile.length < 2) return null;
    const min = Math.min(...elevationProfile);
    const max = Math.max(...elevationProfile);
    const range = max - min || 1;
    return (
      CHART_TOP_PAD +
      chartHeight -
      ((elevationProfile[scrubIndex] - min) / range) * chartHeight
    );
  }, [scrubIndex, elevationProfile, chartHeight]);

  const scrubElevation =
    scrubIndex != null ? elevationProfile[scrubIndex] : null;
  const displayElevation =
    scrubElevation != null
      ? Math.round(scrubElevation)
      : elevationProfile.length > 0
        ? Math.round(Math.min(...elevationProfile))
        : 0;

  const textColor = isDark ? "#fff" : "#1a1a1a";
  const subtextColor = isDark ? "#aaa" : "#666";

  const content = (
    <View style={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.elevText, { color: GREEN }]}>
          {displayElevation} m.a.s.l.
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.statText, { color: subtextColor }]}>
            ↑ {Math.round(stats.gainM)}m
          </Text>
          <Text style={[styles.statText, { color: subtextColor }]}>
            ↓ {Math.round(stats.lossM)}m
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View
        style={styles.chartArea}
        onLayout={onChartLayout}
        {...panResponder.panHandlers}
      >
        <Svg
          width="100%"
          height={chartHeight + CHART_TOP_PAD + CHART_BOTTOM_PAD}
        >
          <Defs>
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={GREEN} stopOpacity="0.35" />
              <Stop offset="1" stopColor={GREEN} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {yLabels.map((l) => (
            <Line
              key={l.value}
              x1={0}
              y1={l.y}
              x2="100%"
              y2={l.y}
              stroke={isDark ? "#fff" : "#000"}
              strokeOpacity={0.15}
              strokeWidth={1}
            />
          ))}

          {/* Filled area */}
          {fillD ? <Path d={fillD} fill="url(#fillGrad)" /> : null}

          {/* Line */}
          {pathD ? (
            <Path
              d={pathD}
              fill="none"
              stroke={GREEN}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Scrub line + dot */}
          {scrubX != null && scrubY != null && (
            <>
              <Line
                x1={scrubX}
                y1={CHART_TOP_PAD}
                x2={scrubX}
                y2={CHART_TOP_PAD + chartHeight}
                stroke={GREEN}
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <Circle cx={scrubX} cy={scrubY} r={5} fill={GREEN} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </Svg>

        {/* Y-axis labels (right side) */}
        {yLabels.map((l) => (
          <Text
            key={l.value}
            style={[
              styles.yLabel,
              {
                top: l.y - 6,
                color: subtextColor,
              },
            ]}
          >
            {l.value}
          </Text>
        ))}

        {/* Scrub tooltip */}
        {scrubX != null && scrubElevation != null && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(
                  0,
                  Math.min(scrubX - 40, (chartWidthRef.current || 300) - 80),
                ),
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              {Math.round(scrubElevation)} m.a.s.l.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (!visible) return null;

  const positionStyle = { top, left: 16, right: 16 };

  if (hasGlass) {
    return (
      <View style={[styles.container, positionStyle]}>
        <GlassView style={styles.panel}>{content}</GlassView>
      </View>
    );
  }

  return (
    <View style={[styles.container, positionStyle]}>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: isDark ? "#2a2a2a" : "white",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
          },
        ]}
      >
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 8,
  },
  panel: {
    height: PANEL_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    paddingHorizontal: CHART_H_PAD,
    paddingTop: 10,
    paddingBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: HEADER_HEIGHT,
  },
  elevText: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  statText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  yLabel: {
    position: "absolute",
    right: 0,
    fontSize: 10,
    fontWeight: "500",
  },
  tooltip: {
    position: "absolute",
    top: -2,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
