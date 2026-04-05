import { useRef, useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet, Keyboard } from 'react-native';
import MapView, { type MapViewHandle } from '../../components/map/MapView';
import SearchBar from '../../components/search/SearchBar';
import SearchSuggestions from '../../components/search/SearchSuggestions';
import { useSearch } from '../../hooks/useSearch';
import { useRouting } from '../../hooks/useRouting';
import { useMapStore } from '../../stores/mapStore';
import { useSearchStore } from '../../stores/searchStore';

export default function MapScreen() {
  const mapViewRef = useRef<MapViewHandle>(null);
  const { selectedResult, isFocused, isLoading, results, setFocused } =
    useSearch();
  useRouting();

  const showSuggestions = isFocused || isLoading || results.length > 0;

  const searchPin = useMemo(() => {
    if (!selectedResult) return null;
    const lng = parseFloat(selectedResult.lon);
    const lat = parseFloat(selectedResult.lat);
    const name = selectedResult.display_name.split(', ')[0];
    return { coordinate: [lng, lat] as [number, number], name };
  }, [selectedResult]);

  useEffect(() => {
    if (selectedResult) {
      const lng = parseFloat(selectedResult.lon);
      const lat = parseFloat(selectedResult.lat);
      mapViewRef.current?.flyTo([lng, lat]);
      useMapStore.getState().setFollowUser(false);
    }
  }, [selectedResult]);

  const handleDismissSearch = () => {
    setFocused(false);
    useSearchStore.getState().setResults([]);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapViewRef} searchPin={searchPin} />

      {showSuggestions && (
        <Pressable style={styles.dimOverlay} onPress={handleDismissSearch} />
      )}

      <SearchBar />
      {showSuggestions && <SearchSuggestions />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
});
