import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { TrackingMapProps } from './tracking-map-types';

const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

export function TrackingMap({ reportPoint, collectorPoint, reportLabel, collectorLabel = 'Collector', height = 250 }: TrackingMapProps) {
  const html = useMemo(() => {
    const report = reportPoint ? {
      latitude: reportPoint.latitude, longitude: reportPoint.longitude, label: escapeHtml(reportLabel),
    } : null;
    const collector = collectorPoint ? {
      latitude: collectorPoint.latitude, longitude: collectorPoint.longitude, label: escapeHtml(collectorLabel),
    } : null;
    const center = reportPoint ?? collectorPoint ?? DEFAULT_CENTER;
    const points = [report, collector].filter(Boolean);
    const encoded = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>html,body,#map{height:100%;width:100%;margin:0;background:#e8efe9} .leaflet-control-attribution{font-size:9px} .leaflet-popup-content{font:13px system-ui}</style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script></head><body><div id="map"></div>
      <script>
        const report=${encoded(report)}, collector=${encoded(collector)}, points=${encoded(points)};
        const map=L.map('map',{zoomControl:true,attributionControl:true}).setView([${center.latitude},${center.longitude}],report||collector?14:5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
        if(report){L.circleMarker([report.latitude,report.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#ea580c',fillOpacity:1}).addTo(map).bindPopup('<b>Pickup location</b><br>'+report.label);}
        if(collector){L.circleMarker([collector.latitude,collector.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#15803d',fillOpacity:1}).addTo(map).bindPopup('<b>'+collector.label+'</b><br>Latest shared location');}
        if(report&&collector){L.polyline([[collector.latitude,collector.longitude],[report.latitude,report.longitude]],{color:'#16a34a',weight:4,dashArray:'7 5'}).addTo(map);}
        if(points.length>1){map.fitBounds(points.map(p=>[p.latitude,p.longitude]),{padding:[40,40],maxZoom:15});}
      </script></body></html>`;
  }, [reportPoint, collectorPoint, reportLabel, collectorLabel]);

  return <View style={[styles.frame, { height }]}>
    <WebView
      // Give Android WebView a real HTTPS origin: inline HTML with the default
      // about:blank origin can silently block the remote Leaflet assets/tiles.
      source={{ html, baseUrl: 'https://www.openstreetmap.org/' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="never"
      startInLoadingState
      renderLoading={() => <View style={styles.loading}><ActivityIndicator color="#15803d" /><Text style={styles.loadingText}>Loading OpenStreetMap…</Text></View>}
      onError={event => console.warn('[tracking-map] WebView failed to load', event.nativeEvent.description)}
      onHttpError={event => console.warn('[tracking-map] HTTP error', event.nativeEvent.statusCode, event.nativeEvent.url)}
      setSupportMultipleWindows={false}
      style={styles.webView}
      accessibilityLabel="OpenStreetMap showing waste pickup and collector locations"
    />
  </View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#e8efe9' },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFill, zIndex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8efe9' },
  loadingText: { color: '#526358', fontSize: 12, fontWeight: '600' },
});
