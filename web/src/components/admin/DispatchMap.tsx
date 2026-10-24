"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type DispatchReport = {
  id: number; location: string; latitude: number | null; longitude: number | null;
  wasteType: string; amount: string; status: string; collectorName: string | null;
  collectorPhone: string | null; collectorLatitude: number | null; collectorLongitude: number | null;
  collectorLastLocationAt: string | null;
};
type DispatchCollector = {
  id: number; name: string; email: string | null; phone: string | null; role: string;
  lastLatitude: number | null; lastLongitude: number | null; lastLocationAt: string | null;
  collectorOnline: boolean; collectorTracking: boolean;
};

const MUNGER_BIHAR: [number, number] = [25.3756, 86.4744];
const LIVE_LOCATION_TTL_MS = 3 * 60 * 1000;

function isFreshLocation(timestamp: string | null, now: number) {
  if (!timestamp || now <= 0) return false;
  const updatedAt = Date.parse(timestamp);
  return Number.isFinite(updatedAt) && now - updatedAt < LIVE_LOCATION_TTL_MS;
}

function MapViewport({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.6 }); }, [center, zoom, map]);
  return null;
}

function fitCurrentLocation(onLocation: (point: [number, number]) => void) {
  if (!navigator.geolocation) {
    window.alert("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => onLocation([coords.latitude, coords.longitude]),
    ({ message }) => window.alert(`GPS location access denied or unavailable: ${message}`),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

export function DispatchMap({
  reports,
  users,
  districtCenter,
  districtZoom = 13,
  districtName = "Munger District",
}: {
  reports: DispatchReport[];
  users: DispatchCollector[];
  districtCenter?: [number, number] | null;
  districtZoom?: number;
  districtName?: string;
}) {
  const [customCenter, setCustomCenter] = useState<[number, number] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(districtZoom);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (districtCenter) {
      setCustomCenter(districtCenter);
      setZoomLevel(districtZoom);
    }
  }, [districtCenter, districtZoom]);

  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  const locatedReports = reports.filter(report => report.latitude != null && report.longitude != null);
  const liveCollectors = users.filter(user =>
    user.role === "collector" && user.collectorTracking && user.lastLatitude != null && user.lastLongitude != null
  );
  const collectorTelemetry = users
    .filter(user => user.role === "collector" && user.lastLatitude != null && user.lastLongitude != null)
    .sort((a, b) => Date.parse(b.lastLocationAt || "0") - Date.parse(a.lastLocationAt || "0"))
    .slice(0, 8);

  const first = locatedReports[0];
  const firstCollector = liveCollectors[0];
  const defaultCenter: [number, number] = first
    ? [first.latitude!, first.longitude!]
    : firstCollector ? [firstCollector.lastLatitude!, firstCollector.lastLongitude!] : MUNGER_BIHAR;
  const center = customCenter || defaultCenter;

  const reportIcon = useMemo(() => (status: string) => {
    const bg = status === "pending" ? "#f59e0b" : status === "assigned" ? "#2563eb" : "#16a34a";
    const emoji = status === "pending" ? "⚠️" : status === "assigned" ? "📦" : "✅";
    return L.divIcon({
      className: "wastechain-map-marker",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:${bg};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.3);"><span style="transform:rotate(45deg);font-size:16px;">${emoji}</span></div>`,
      iconSize: [36, 42], iconAnchor: [18, 38], popupAnchor: [0, -36],
    });
  }, []);
  const collectorIcon = useMemo(() => L.divIcon({
    className: "wastechain-map-marker",
    html: '<div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#15803d;border:2.5px solid white;border-radius:50%;box-shadow:0 4px 14px rgba(21,128,61,0.5);font-size:18px;">🛵<span style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#22c55e;border:2px solid white;border-radius:50%;"></span></div>',
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20],
  }), []);

  return (
    <section className="space-y-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2"><span className="text-xl">🗺️</span><h2 className="text-lg font-extrabold text-gray-900">{districtName} Dispatch &amp; Live Map</h2></div>
          <p className="mt-1 text-xs text-gray-500">OpenStreetMap · Live complaint pins, assigned collectors, and routes. Auto-updates every 15s.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <button onClick={() => fitCurrentLocation(point => { setCustomCenter(point); setZoomLevel(14); })} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-white shadow-sm transition-all hover:bg-blue-700">📍 My GPS</button>
          <button onClick={() => { setCustomCenter(districtCenter || MUNGER_BIHAR); setZoomLevel(13); }} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-white shadow-sm transition-all hover:bg-emerald-700">🎯 District Center</button>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-orange-800">{locatedReports.length} complaints</span>
          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-800">{liveCollectors.length} collectors live</span>
        </div>
      </div>

      <div className="relative z-0 h-[min(68vh,660px)] min-h-[360px] overflow-hidden rounded-[22px]">
        <MapContainer center={center} zoom={zoomLevel} scrollWheelZoom className="h-full w-full">
          <MapViewport center={center} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {locatedReports.map(report => {
            const point: [number, number] = [report.latitude!, report.longitude!];
            const fresh = isFreshLocation(report.collectorLastLocationAt, now);
            const collectorPoint: [number, number] | null = report.collectorLatitude != null && report.collectorLongitude != null
              ? [report.collectorLatitude, report.collectorLongitude] : null;
            return <Fragment key={report.id}>
              {collectorPoint && fresh ? <Polyline positions={[collectorPoint, point]} pathOptions={{ color: "#16a34a", opacity: 0.85, weight: 3, dashArray: "7 5" }} /> : null}
              <ReportPin position={point} icon={reportIcon(report.status)} label={`Complaint #${report.id} · ${report.wasteType}`} popup={<>
                <strong>Complaint #{report.id} · {report.status.toUpperCase()}</strong>
                <p>{report.wasteType} · {report.amount}</p><p>{report.location}</p>
                <p>Collector: {report.collectorName || "Awaiting assignment"}</p>
                {report.collectorPhone ? <a href={`tel:${report.collectorPhone}`}>{report.collectorPhone}</a> : null}
                {collectorPoint ? <p>Collector last shared a live location.</p> : null}
              </>} />
            </Fragment>;
          })}
          {liveCollectors.map(collector => {
            const point: [number, number] = [collector.lastLatitude!, collector.lastLongitude!];
            return <ReportPin key={`collector-${collector.id}`} position={point} icon={collectorIcon} label={`Collector · ${collector.name}`} popup={<>
              <strong>{collector.name}</strong>
              {collector.phone ? <p><a href={`tel:${collector.phone}`}>{collector.phone}</a></p> : <p>Phone not added</p>}
              <p>{collector.lastLocationAt ? `Updated ${new Date(collector.lastLocationAt).toLocaleTimeString()}` : "Location time unavailable"}</p>
            </>} />;
          })}
        </MapContainer>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {collectorTelemetry.length ? collectorTelemetry.map(collector => {
          const fresh = isFreshLocation(collector.lastLocationAt, now);
          return <div key={collector.id} className={`rounded-2xl border p-3 text-xs ${fresh ? "border-green-200 bg-green-50 text-green-900" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
            <div className="flex items-center justify-between gap-3"><strong className="text-sm text-gray-900">{collector.name}</strong><span className={`rounded-full px-2 py-0.5 font-bold ${fresh ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>{fresh ? "LIVE" : "STALE"}</span></div>
            <p className="mt-1">Lat/Lng: {collector.lastLatitude?.toFixed(5)}, {collector.lastLongitude?.toFixed(5)}</p>
            <p>{collector.lastLocationAt ? `Updated ${new Date(collector.lastLocationAt).toLocaleString()}` : "No update time"}</p>
            {collector.phone ? <a href={`tel:${collector.phone}`} className="font-bold text-green-700">{collector.phone}</a> : null}
          </div>;
        }) : <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No collector has shared GPS coordinates yet. Ask a collector to go online in the APK.</div>}
      </div>
      <p className="text-[11px] text-gray-500">Complaint pins: orange. Collectors with a fresh location update in the last 3 minutes: green. Map data © OpenStreetMap contributors. Tap a pin to view details.</p>
    </section>
  );
}

function ReportPin({ position, icon, label, popup }: {
  position: [number, number]; icon: L.DivIcon; label: string; popup?: ReactNode;
}) {
  return <Marker position={position} icon={icon} title={label}>
    <Popup>{popup || <span>{label}</span>}</Popup>
  </Marker>;
}
