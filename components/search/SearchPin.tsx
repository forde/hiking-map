import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { MarkerView, Callout } from '@maplibre/maplibre-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SearchPinProps {
  coordinate: [number, number];
  name: string;
}

export default function SearchPin({ coordinate, name }: SearchPinProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <MarkerView id="search-pin" coordinate={coordinate}>
      <View style={styles.pinContainer}>
        <View
          style={[
            styles.callout,
            {
              backgroundColor: isDark ? '#2a2a2a' : 'white',
            },
          ]}
        >
          <Text
            style={[styles.name, { color: isDark ? '#fff' : '#1a1a1a' }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text
            style={[
              styles.coords,
              { color: isDark ? '#aaa' : '#666' },
            ]}
          >
            {coordinate[1].toFixed(5)}, {coordinate[0].toFixed(5)}
          </Text>
        </View>
        <View style={styles.arrow} />
        <Icon name="map-marker" size={36} color="#E53935" />
      </View>
    </MarkerView>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
  },
  callout: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: 220,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  coords: {
    fontSize: 11,
    marginTop: 2,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginBottom: -2,
  },
});
