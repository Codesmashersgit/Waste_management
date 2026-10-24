'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const MUNGER_BIHAR: [number, number] = [25.3756, 86.4744]

// Hotspot points around Munger district
const HOTSPOTS: [number, number][] = [
  [25.3756, 86.4744],
  [25.3840, 86.4680],
  [25.3670, 86.4810],
  [25.3920, 86.4910],
  [25.3610, 86.4620],
  [25.3790, 86.4520],
  [25.3710, 86.4900],
  [25.3880, 86.4720],
]

function FreezeMap() {
  const map = useMap()
  useEffect(() => {
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    if (map.tapHold) map.tapHold.disable()
  }, [map])
  return null
}

export default function ClientMapBackground() {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={MUNGER_BIHAR}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        className="w-full h-full"
        style={{ height: '100%', width: '100%', background: '#eaf1eb' }}
      >
        <FreezeMap />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {HOTSPOTS.map((pos, i) => (
          <CircleMarker
            key={i}
            center={pos}
            radius={8}
            pathOptions={{
              color: '#15803d',
              fillColor: '#22c55e',
              fillOpacity: 0.9,
              weight: 2.5,
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
