import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { MAP_SOURCES, type MapSource } from '../../constants/mapSources';

const hasGlass = isLiquidGlassAvailable();

interface Props {
  visible: boolean;
  selected: MapSource;
  onSelect: (source: MapSource) => void;
  onDismiss: () => void;
}

export default function MapSourcePicker({
  visible,
  selected,
  onSelect,
  onDismiss,
}: Props) {
  const isDark = useColorScheme() === 'dark';

  const content = (
    <>
      <Text
        variant="titleMedium"
        style={[styles.title, { color: isDark ? '#fff' : '#000' }]}
      >
        Map Style
      </Text>
      {MAP_SOURCES.map((source) => (
        <Pressable
          key={source.id}
          style={styles.row}
          onPress={() => {
            onSelect(source);
            onDismiss();
          }}
        >
          <RadioButton
            value={source.id}
            status={selected.id === source.id ? 'checked' : 'unchecked'}
            onPress={() => {
              onSelect(source);
              onDismiss();
            }}
            color="#2E7D32"
          />
          <Text
            style={[styles.label, { color: isDark ? '#ddd' : '#333' }]}
          >
            {source.name}
          </Text>
        </Pressable>
      ))}
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {hasGlass ? (
          <GlassView
            style={styles.glassSheet}
            onStartShouldSetResponder={() => true}
          >
            {content}
          </GlassView>
        ) : (
          <View
            style={[
              styles.sheet,
              { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  glassSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    marginLeft: 4,
  },
});
