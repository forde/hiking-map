import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSearch } from '../../hooks/useSearch';
import type { NominatimResult } from '../../services/geocoding';

const hasGlass = isLiquidGlassAvailable();

// Search bar height (48) + gap (8) + container top offset (insets.top + 8)
const SEARCH_BAR_HEIGHT = 48;
const GAP = 8;

function parsePlaceName(displayName: string): {
  primary: string;
  secondary: string;
} {
  const parts = displayName.split(', ');
  return {
    primary: parts[0],
    secondary: parts.slice(1).join(', '),
  };
}

export default function SearchSuggestions() {
  const { results, isLoading, query, selectResult } = useSearch();
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const topOffset = insets.top + 8 + SEARCH_BAR_HEIGHT + GAP;

  const showEmpty = !isLoading && results.length === 0 && query.length >= 3;

  const renderItem = ({ item }: { item: NominatimResult }) => {
    const { primary, secondary } = parsePlaceName(item.display_name);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => selectResult(item)}
      >
        <Icon
          name="map-marker"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={styles.rowIcon}
        />
        <View style={styles.rowText}>
          <Text
            style={[styles.primary, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {primary}
          </Text>
          {secondary ? (
            <Text
              style={[
                styles.secondary,
                { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {secondary}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const content = (
    <>
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
      {showEmpty && (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            No results found
          </Text>
        </View>
      )}
      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.place_id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
        />
      )}
    </>
  );

  if (!isLoading && results.length === 0 && query.length < 3) {
    return null;
  }

  const containerStyle = [
    styles.container,
    { top: topOffset },
  ];

  const fallbackBg = isDark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)';

  if (hasGlass) {
    return (
      <GlassView style={[containerStyle, styles.panel]}>
        {content}
      </GlassView>
    );
  }

  return (
    <View
      style={[containerStyle, styles.panel, { backgroundColor: fallbackBg }, styles.shadow]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    maxHeight: 300,
  },
  panel: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  primary: {
    fontSize: 15,
    fontWeight: '600',
  },
  secondary: {
    fontSize: 13,
    marginTop: 2,
  },
  centered: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
