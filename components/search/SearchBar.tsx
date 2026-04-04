import React, { useRef } from 'react';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSearch } from '../../hooks/useSearch';
import { useSearchStore } from '../../stores/searchStore';

const hasGlass = isLiquidGlassAvailable();

export default function SearchBar() {
  const { query, setQuery, setFocused, clearSearch, selectedResult } =
    useSearch();
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion onPress to fire first
    blurTimeoutRef.current = setTimeout(() => {
      setFocused(false);
    }, 150);
  };

  const handleChangeText = (text: string) => {
    if (selectedResult) {
      // Clear the pin but keep focus intact
      useSearchStore.getState().setSelectedResult(null);
    }
    setQuery(text);
  };

  const containerStyle = [
    styles.container,
    { top: insets.top + 8 },
  ];

  const fallbackBg = isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)';

  const inner = (
    <View style={styles.inner}>
      <IconButton
        icon="magnify"
        size={20}
        iconColor={theme.colors.onSurfaceVariant}
        style={styles.iconLeft}
        onPress={() => inputRef.current?.focus()}
      />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: theme.colors.onSurface }]}
        placeholder="Search places..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
      />
      {query.length > 0 && (
        <IconButton
          icon="close"
          size={18}
          iconColor={theme.colors.onSurfaceVariant}
          style={styles.iconRight}
          onPress={clearSearch}
        />
      )}
    </View>
  );

  if (hasGlass) {
    return (
      <GlassView style={[containerStyle, styles.pill]}>
        {inner}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        styles.pill,
        { backgroundColor: fallbackBg },
        styles.shadow,
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  pill: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginLeft: 4,
    marginRight: -4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  iconRight: {
    marginRight: 4,
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
