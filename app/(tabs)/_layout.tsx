import { useColorScheme } from "react-native";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs
      iconColor={{
        default: colorScheme === "dark" ? "#888" : "#666",
        selected: colorScheme === "dark" ? "#81C784" : "#2E7D32",
      }}
    >
      <NativeTabs.Trigger name="index" options={{ title: "Map" }}>
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tracks" options={{ title: "Tracks" }}>
        <Icon sf="point.bottomleft.forward.to.point.topright.scurvepath" />
        <Label>Tracks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="routes" options={{ title: "Routes" }}>
        <Icon sf={{ default: "signpost.right", selected: "signpost.right.fill" }} />
        <Label>Routes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" options={{ title: "Settings" }}>
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
