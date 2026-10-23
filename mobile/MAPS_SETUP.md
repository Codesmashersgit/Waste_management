# OpenStreetMap setup

Web dispatch, report pin selection, and mobile collector tracking use OpenStreetMap data and tiles. No Google Maps account, mapping API key, or mapping environment variable is required.

The admin and report maps use Leaflet. The Android/iOS tracking map renders Leaflet in the Expo WebView, so it does not use the Google-backed native `react-native-maps` provider. The mobile app needs a fresh EAS/development build after installing `react-native-webview` and removing the old native maps dependency.

Every map displays OpenStreetMap attribution. Tile URLs use the public OSM tile service for interactive app usage; do not bulk-download, prefetch, or package its tiles for offline use. For production traffic beyond normal interactive use, configure a hosted OSM tile provider or self-host tiles and update the tile URL in the Leaflet map components.
