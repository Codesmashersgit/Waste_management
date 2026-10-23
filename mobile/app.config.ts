import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

// OSM tiles are rendered in the tracking map without a native mapping SDK or API key.
export default appJson.expo as ExpoConfig;
