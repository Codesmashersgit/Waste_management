"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [25.3756, 86.4744];
const pin = L.divIcon({
  className: "wastechain-map-marker",
  html: '<span style="display:grid;place-items:center;width:32px;height:32px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#16a34a;box-shadow:0 2px 8px #0005"><i style="width:8px;height:8px;border-radius:50%;background:white"></i></span>',
  iconSize: [32, 40], iconAnchor: [16, 36],
});

function ClickToPick({ onPick }: { onPick: (point: [number, number]) => void }) {
  useMapEvents({ click: event => onPick([event.latlng.lat, event.latlng.lng]) });
  return null;
}

function MoveToPoint({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo(point, Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [map, point]);
  return null;
}

export function LocationPicker({ value, onChange }: {
  value: { latitude: number; longitude: number } | null;
  onChange: (point: { latitude: number; longitude: number }) => void;
}) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  useEffect(() => {
    if (value) setCenter([value.latitude, value.longitude]);
  }, [value]);
  const selected: [number, number] | null = value ? [value.latitude, value.longitude] : null;
  return <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
    <div className="h-64 w-full">
      <MapContainer center={center} zoom={selected ? 15 : 11} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <MoveToPoint point={selected} />
        <ClickToPick onPick={([latitude, longitude]) => onChange({ latitude, longitude })} />
        {selected ? <Marker position={selected} icon={pin} /> : null}
      </MapContainer>
    </div>
    <div className="flex items-center justify-between gap-3 bg-green-50 px-3 py-2 text-xs text-green-900">
      <span>{value ? `Pickup pin: ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : "Tap the map to pin the exact waste pickup location."}</span>
      <span className="shrink-0 text-[10px]">© OpenStreetMap</span>
    </div>
  </div>;
}
