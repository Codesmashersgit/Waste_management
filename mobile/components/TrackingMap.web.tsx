import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TrackingMapProps } from './tracking-map-types';

const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 };

export function TrackingMap({ reportPoint, collectorPoint, reportLabel, collectorLabel = 'Collector', height = 250 }: TrackingMapProps) {
  const center = reportPoint ?? collectorPoint ?? DEFAULT_CENTER;
  const points = [reportPoint, collectorPoint].filter((point): point is NonNullable<typeof point> => point != null);
  const latitudes = points.map(point => point.latitude);
  const longitudes = points.map(point => point.longitude);
  const padding = 0.012;
  const south = Math.min(...(latitudes.length ? latitudes : [center.latitude])) - padding;
  const north = Math.max(...(latitudes.length ? latitudes : [center.latitude])) + padding;
  const west = Math.min(...(longitudes.length ? longitudes : [center.longitude])) - padding;
  const east = Math.max(...(longitudes.length ? longitudes : [center.longitude])) + padding;
  const marker = reportPoint ? `&marker=${reportPoint.latitude}%2C${reportPoint.longitude}` : '';
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik${marker}`;

  return <View style={[styles.frame, { height }]}>
    {createElement('iframe', {
      title: `OpenStreetMap: ${reportLabel}`,
      src: url,
      loading: 'lazy',
      referrerPolicy: 'no-referrer',
      style: { width: '100%', height: '100%', border: 0 },
    })}
    <Text style={styles.attribution}>© OpenStreetMap contributors · {collectorPoint ? `${collectorLabel}: ${collectorPoint.latitude.toFixed(4)}, ${collectorPoint.longitude.toFixed(4)}` : reportLabel}</Text>
  </View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#e8efe9' },
  attribution: { position: 'absolute', bottom: 4, left: 5, paddingHorizontal: 5, backgroundColor: '#ffffffdd', color: '#334155', fontSize: 9 },
});
