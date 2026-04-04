import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function RoutesScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Saved Routes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
