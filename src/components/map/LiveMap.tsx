'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DriverLocation } from '@/types'
import { t } from '@/lib/i18n'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// Fix Leaflet default marker icons in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string,unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeDriverIcon(stale: boolean, name: string) {
  const color = stale ? '#f59e0b' : '#22c55e'
  const firstName = name.split(' ')[0]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 66" width="60" height="66">
    <circle cx="30" cy="22" r="18" fill="${color}" stroke="white" stroke-width="3"/>
    <text x="30" y="29" text-anchor="middle" font-size="18" fill="white">🚚</text>
    <rect x="1" y="43" width="58" height="20" rx="4" fill="${color}" opacity="0.92"/>
    <text x="30" y="57" text-anchor="middle" font-size="11" font-weight="bold" font-family="sans-serif" fill="white">${firstName}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [60, 66],
    iconAnchor: [30, 66],
    popupAnchor: [0, -66],
  })
}

// Pan map to selected driver
function MapFocuser({ locations, selectedDriverId }: { locations: DriverLocation[]; selectedDriverId: string | null }) {
  const map = useMap()
  const prevSelected = useRef<string | null>(null)

  useEffect(() => {
    if (selectedDriverId && selectedDriverId !== prevSelected.current) {
      const loc = locations.find(l => l.driver_id === selectedDriverId)
      if (loc) map.flyTo([loc.lat, loc.lng], 14, { duration: 1 })
      prevSelected.current = selectedDriverId
    }
  }, [selectedDriverId, locations, map])

  return null
}

interface Props {
  locations: DriverLocation[]
  onSelectDriver: (loc: DriverLocation) => void
  selectedDriverId: string | null
}

const STALE_MS = 5 * 60 * 1000

export default function LiveMap({ locations, onSelectDriver, selectedDriverId }: Props) {
  // Default center: Jakarta, Indonesia
  const defaultCenter: [number, number] = [-6.2088, 106.8456]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocuser locations={locations} selectedDriverId={selectedDriverId} />

      {locations.map(loc => {
        const stale = Date.now() - new Date(loc.recorded_at).getTime() > STALE_MS
        const driver = loc.driver as {full_name: string} | undefined
        return (
          <Marker
            key={loc.driver_id}
            position={[loc.lat, loc.lng]}
            icon={makeDriverIcon(stale, driver?.full_name ?? '')}
            eventHandlers={{ click: () => onSelectDriver(loc) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">{driver?.full_name}</p>
                <p className="text-gray-500">
                  {t.lastSeen}: {formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true, locale: idLocale })}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
