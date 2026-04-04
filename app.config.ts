import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HikeMap',
  slug: 'hikemap',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.hikemap',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'HikeMap needs your location to show your position on the map.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'HikeMap needs background location access to record your hiking tracks.',
      NSMotionUsageDescription:
        'HikeMap uses motion data to count your steps during hike recording.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'app.hikemap',
    edgeToEdgeEnabled: true,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'ACTIVITY_RECOGNITION',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', '@maplibre/maplibre-react-native'],
  scheme: 'hikemap',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    valhallaUrl: process.env.EXPO_PUBLIC_VALHALLA_URL,
    protomapsR2Url: process.env.EXPO_PUBLIC_PROTOMAPS_R2_URL,
    shareBaseUrl: process.env.EXPO_PUBLIC_SHARE_BASE_URL,
    thunderforestApiKey: process.env.EXPO_PUBLIC_THUNDERFOREST_API_KEY,
  },
});
