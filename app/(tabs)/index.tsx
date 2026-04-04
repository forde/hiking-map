import { View, StyleSheet } from 'react-native';
import MapView from '../../components/map/MapView';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
