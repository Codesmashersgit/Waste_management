export type MapPoint = {
  latitude: number;
  longitude: number;
};

export type TrackingMapProps = {
  reportPoint: MapPoint | null;
  collectorPoint?: MapPoint | null;
  reportLabel: string;
  collectorLabel?: string;
  height?: number;
};
