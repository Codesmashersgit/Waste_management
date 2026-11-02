"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
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

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const LIVE_LOCATION_TTL_MS = 3 * 60 * 1000;
const AUTO_RECENTER_MS = 30_000;

function isFreshLocation(timestamp: string | null, now: number) {
  if (!timestamp || now <= 0) return false;
  const updatedAt = Date.parse(timestamp);
  return Number.isFinite(updatedAt) && now - updatedAt < LIVE_LOCATION_TTL_MS;
}

function MapViewport({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.7 }); }, [center, zoom, map]);
  return null;
}

function MapInvalidator({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Re-render tiles when fullscreen toggled
    setTimeout(() => map.invalidateSize(), 100);
  }, [trigger, map]);
  return null;
}

function MapMoveWatcher({ onUserMove }: { onUserMove: () => void }) {
  useMapEvents({ dragstart: onUserMove, zoomstart: onUserMove });
  return null;
}

export function DispatchMap({
  reports,
  users,
  districtCenter,
  districtZoom = 13,
  districtName = "Live GPS Zone",
}: {
  reports: DispatchReport[];
  users: DispatchCollector[];
  districtCenter?: [number, number] | null;
  districtZoom?: number;
  districtName?: string;
}) {
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null);
  const [gpsCity, setGpsCity] = useState<string>("Detecting...");
  const [gpsStatus, setGpsStatus] = useState<"pending" | "active" | "denied" | "idle">("pending");
  const watchIdRef = useRef<number | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>(districtCenter || INDIA_CENTER);
  const [zoomLevel, setZoomLevel] = useState(districtCenter ? districtZoom : 5);
  const [isLockedToGps, setIsLockedToGps] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recenterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recenterCountdown, setRecenterCountdown] = useState(AUTO_RECENTER_MS / 1000);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    setNow(Date.now());
    return () => clearInterval(t);
  }, []);

  // ── GPS Acquisition ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("denied");
      if (districtCenter) { setMapCenter(districtCenter); setZoomLevel(districtZoom); }
      return;
    }
    setGpsStatus("pending");
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const coords: [number, number] = [lat, lon];
        setGpsCoords(coords);
        setGpsStatus("active");
        setIsLockedToGps(prev => {
          if (prev) { setMapCenter(coords); setZoomLevel(15); }
          return prev;
        });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const city = data.address?.suburb || data.address?.city || data.address?.town ||
            data.address?.state_district || data.address?.county || "Your Location";
          const state = data.address?.state || "India";
          setGpsCity(`${city}, ${state}`);
        } catch {
          setGpsCity(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      },
      () => {
        setGpsStatus("denied");
        if (districtCenter) { setMapCenter(districtCenter); setZoomLevel(districtZoom); }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current!); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual move → unlock GPS → start countdown to re-snap ───────────
  const handleUserMove = useCallback(() => {
    setIsLockedToGps(false);
    if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRecenterCountdown(AUTO_RECENTER_MS / 1000);
    countdownRef.current = setInterval(() => {
      setRecenterCountdown(prev => {
        if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    recenterTimerRef.current = setTimeout(() => {
      setGpsCoords(gps => {
        if (gps) { setMapCenter(gps); setZoomLevel(15); setIsLockedToGps(true); }
        return gps;
      });
    }, AUTO_RECENTER_MS);
  }, []);

  const snapToGps = useCallback(() => {
    if (!gpsCoords) return;
    if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setMapCenter(gpsCoords);
    setZoomLevel(15);
    setIsLockedToGps(true);
  }, [gpsCoords]);

  // ── Fullscreen toggle (also lock body scroll) ────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  }, []);

  // Close fullscreen on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && isFullscreen) toggleFullscreen(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, toggleFullscreen]);

  useEffect(() => () => {
    if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    document.body.style.overflow = "";
  }, []);

  // ── Map data ──────────────────────────────────────────────────────────
  const locatedReports = reports.filter(r => r.latitude != null && r.longitude != null);
  const liveCollectors = users.filter(u =>
    u.role === "collector" && u.collectorTracking && u.lastLatitude != null && u.lastLongitude != null
  );
  const collectorTelemetry = users
    .filter(u => u.role === "collector" && u.lastLatitude != null && u.lastLongitude != null)
    .sort((a, b) => Date.parse(b.lastLocationAt || "0") - Date.parse(a.lastLocationAt || "0"))
    .slice(0, 8);

  // Status counts for fullscreen legend
  const pendingCount = locatedReports.filter(r => r.status === "pending").length;
  const assignedCount = locatedReports.filter(r => r.status === "assigned").length;
  const collectedCount = locatedReports.filter(r => r.status === "collected" || r.status === "sold").length;

  // ── Icons ──────────────────────────────────────────────────────────────
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

  const myGpsIcon = useMemo(() => L.divIcon({
    className: "wastechain-map-marker",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(59,130,246,0.15);top:50%;left:50%;transform:translate(-50%,-50%);animation:gpsPulse 2s ease-out infinite;"></div>
      <div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.4),0 4px 12px rgba(0,0,0,0.4);"></div>
    </div>
    <style>@keyframes gpsPulse{0%{transform:translate(-50%,-50%) scale(0.6);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}</style>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14],
  }), []);

  const statusColor = gpsStatus === "active" ? "#22c55e" : gpsStatus === "pending" ? "#f59e0b" : "#ef4444";
  const statusLabel = gpsStatus === "active" ? "GPS LIVE" : gpsStatus === "pending" ? "Acquiring..." : "GPS Denied";

  // ── Shared Map JSX (same map rendered in both modes) ──────────────────
  const mapJsx = (
    <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom className="h-full w-full">
      <MapViewport center={mapCenter} zoom={zoomLevel} />
      <MapMoveWatcher onUserMove={handleUserMove} />
      <MapInvalidator trigger={isFullscreen} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* MY GPS */}
      {gpsCoords && (
        <Marker position={gpsCoords} icon={myGpsIcon} title="Your GPS Location" zIndexOffset={1000}>
          <Popup>
            <strong>📍 You are here</strong>
            <p style={{ fontSize: 11, marginTop: 4 }}>{gpsCity}</p>
            <p style={{ fontSize: 10, color: "#6b7280" }}>{gpsCoords[0].toFixed(5)}, {gpsCoords[1].toFixed(5)}</p>
          </Popup>
        </Marker>
      )}

      {/* COMPLAINT PINS */}
      {locatedReports.map(report => {
        const point: [number, number] = [report.latitude!, report.longitude!];
        const fresh = isFreshLocation(report.collectorLastLocationAt, now);
        const collectorPoint: [number, number] | null =
          report.collectorLatitude != null && report.collectorLongitude != null
            ? [report.collectorLatitude, report.collectorLongitude] : null;
        return (
          <Fragment key={report.id}>
            {collectorPoint && fresh ? (
              <Polyline positions={[collectorPoint, point]} pathOptions={{ color: "#16a34a", opacity: 0.85, weight: 3, dashArray: "7 5" }} />
            ) : null}
            <ReportPin position={point} icon={reportIcon(report.status)} label={`Complaint #${report.id}`} popup={<>
              <strong>Complaint #{report.id} · {report.status.toUpperCase()}</strong>
              <p>{report.wasteType} · {report.amount}</p>
              <p style={{ fontSize: 11 }}>{report.location}</p>
              <p>Collector: {report.collectorName || "Awaiting assignment"}</p>
              {report.collectorPhone ? <a href={`tel:${report.collectorPhone}`}>{report.collectorPhone}</a> : null}
            </>} />
          </Fragment>
        );
      })}

      {/* COLLECTOR PINS */}
      {liveCollectors.map(collector => {
        const point: [number, number] = [collector.lastLatitude!, collector.lastLongitude!];
        return (
          <ReportPin key={`c-${collector.id}`} position={point} icon={collectorIcon}
            label={`Collector · ${collector.name}`} popup={<>
              <strong>🛵 {collector.name}</strong>
              {collector.phone ? <p><a href={`tel:${collector.phone}`}>{collector.phone}</a></p> : <p>No phone</p>}
              <p style={{ fontSize: 10 }}>{collector.lastLocationAt ? `Updated ${new Date(collector.lastLocationAt).toLocaleTimeString()}` : "No location time"}</p>
            </>} />
        );
      })}
    </MapContainer>
  );

  // ══════════════════════════════════════════════════════════════════════
  // FULLSCREEN OVERLAY
  // ══════════════════════════════════════════════════════════════════════
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-950">
        {/* ── Top HUD Bar ── */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-950/95 px-4 py-2.5 backdrop-blur-xl">
          {/* Left: Title + GPS badge */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg">🗺️</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-sm truncate">
                  {gpsStatus === "active" ? gpsCity : districtName}
                </span>
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white"
                  style={{ background: statusColor }}
                >
                  <span className="block w-1.5 h-1.5 rounded-full bg-white" style={{ animation: gpsStatus === "active" ? "gpsBlink 1.2s ease-in-out infinite" : "none" }} />
                  {statusLabel}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">Full-screen dispatch view · Press Esc to exit</p>
            </div>
          </div>

          {/* Center: Legend pills */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-amber-300">⚠️ Pending: {pendingCount}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-blue-300">📦 Assigned: {assignedCount}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-400/30 px-3 py-1 text-green-300">✅ Collected: {collectedCount}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-emerald-300">🛵 Live Riders: {liveCollectors.length}</span>
            {gpsCoords && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-600/30 border border-blue-500/30 px-3 py-1 text-blue-200">🔵 You</span>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Snap to GPS */}
            {gpsCoords && (
              <button
                onClick={snapToGps}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all
                  ${isLockedToGps ? "bg-blue-700 ring-2 ring-blue-400" : "bg-blue-600 hover:bg-blue-500"}`}
              >
                📍 {isLockedToGps ? "GPS ✓" : "Snap GPS"}
              </button>
            )}

            {/* EXIT FULLSCREEN */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 px-4 py-1.5 text-xs font-black text-white transition-all shadow-lg shadow-red-900/40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              Exit Full Screen
            </button>
          </div>
        </div>

        {/* ── Full Map ── */}
        <div className="relative flex-1 overflow-hidden">
          {mapJsx}

          {/* GPS lock bottom bar */}
          {isLockedToGps && gpsCoords && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-700/90 backdrop-blur-sm px-5 py-1.5 text-xs font-black text-white shadow-xl">
              <span className="animate-pulse">●</span> GPS LOCKED · Tracking your live position
            </div>
          )}
          {!isLockedToGps && gpsCoords && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-500/90 backdrop-blur-sm px-5 py-1.5 text-xs font-black text-gray-900 shadow-xl">
              ⏱ Snapping back to GPS in {recenterCountdown}s
            </div>
          )}

          {/* ESC hint */}
          <div className="pointer-events-none absolute top-4 right-4 z-[999] rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-[10px] font-bold text-gray-400">
            Press <kbd className="rounded bg-gray-700 px-1 text-white">Esc</kbd> to exit
          </div>
        </div>

        <style>{`@keyframes gpsBlink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // NORMAL (CARD) VIEW
  // ══════════════════════════════════════════════════════════════════════
  return (
    <section className="space-y-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">🗺️</span>
            <h2 className="text-lg font-extrabold text-gray-900">
              {gpsStatus === "active" ? gpsCity : districtName} — Live Dispatch Map
            </h2>
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: statusColor }}
            >
              <span className="block rounded-full w-[7px] h-[7px] bg-white" style={{ animation: gpsStatus === "active" ? "gpsBlink 1.2s ease-in-out infinite" : "none" }} />
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {gpsStatus === "active"
              ? `📍 Live GPS · Auto-recenters ${AUTO_RECENTER_MS / 1000}s after manual move`
              : "OpenStreetMap · Allow location for live GPS tracking"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {/* Snap to GPS */}
          <button
            onClick={snapToGps}
            disabled={!gpsCoords}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white shadow-sm transition-all
              ${isLockedToGps ? "bg-blue-700 ring-2 ring-blue-400" : "bg-blue-600 hover:bg-blue-700"}
              ${!gpsCoords ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            📍 {isLockedToGps ? "GPS Locked ✓" : "Snap to GPS"}
          </button>

          {/* FULLSCREEN BUTTON */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-full bg-gray-900 hover:bg-gray-800 active:bg-black px-3.5 py-1.5 text-white shadow-sm transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            Full Screen
          </button>

          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-orange-800">
            {locatedReports.length} complaints
          </span>
          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-800">
            {liveCollectors.length} collectors live
          </span>
        </div>
      </div>

      {/* GPS Denied Banner */}
      {gpsStatus === "denied" && (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <span className="text-xl">🚫</span>
          <div>
            <strong>GPS Permission Denied</strong>
            <p className="text-xs mt-0.5">Enable location in browser settings and refresh for live GPS tracking. Showing {districtName || "India"} view.</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative z-0 h-[min(68vh,660px)] min-h-[360px] overflow-hidden rounded-[22px]">
        {mapJsx}

        {/* GPS Lock indicator */}
        {isLockedToGps && gpsCoords && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 rounded-full border border-blue-300 bg-blue-600/90 backdrop-blur-sm px-4 py-1.5 text-xs font-black text-white shadow-lg">
            <span className="animate-pulse">●</span> GPS LOCKED · Auto-tracking your position
          </div>
        )}
        {!isLockedToGps && gpsCoords && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-500/90 backdrop-blur-sm px-4 py-1.5 text-xs font-black text-gray-900 shadow-lg">
            ⏱ Auto-snapping to GPS in {recenterCountdown}s · tap &quot;Snap to GPS&quot;
          </div>
        )}

        {/* Fullscreen hint button on map corner */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-[999] flex items-center gap-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm border border-gray-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          Full Screen
        </button>
      </div>

      {/* Collector Telemetry Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {collectorTelemetry.length ? collectorTelemetry.map(collector => {
          const fresh = isFreshLocation(collector.lastLocationAt, now);
          return (
            <div key={collector.id} className={`rounded-2xl border p-3 text-xs ${fresh ? "border-green-200 bg-green-50 text-green-900" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-gray-900">{collector.name}</strong>
                <span className={`rounded-full px-2 py-0.5 font-bold ${fresh ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {fresh ? "LIVE" : "STALE"}
                </span>
              </div>
              <p className="mt-1">Lat/Lng: {collector.lastLatitude?.toFixed(5)}, {collector.lastLongitude?.toFixed(5)}</p>
              <p>{collector.lastLocationAt ? `Updated ${new Date(collector.lastLocationAt).toLocaleString()}` : "No update time"}</p>
              {collector.phone ? <a href={`tel:${collector.phone}`} className="font-bold text-green-700">{collector.phone}</a> : null}
            </div>
          );
        }) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            No collector has shared GPS coordinates yet. Ask collectors to go online in the APK.
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500">
        🔵 Blue dot = your GPS · ⚠️ Orange = pending complaint · 📦 Blue = assigned · ✅ Green = collected · 🛵 Green circle = live collector
      </p>
      <style>{`@keyframes gpsBlink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </section>
  );
}

function ReportPin({ position, icon, label, popup }: {
  position: [number, number]; icon: L.DivIcon; label: string; popup?: ReactNode;
}) {
  return (
    <Marker position={position} icon={icon} title={label}>
      <Popup>{popup || <span>{label}</span>}</Popup>
    </Marker>
  );
}
