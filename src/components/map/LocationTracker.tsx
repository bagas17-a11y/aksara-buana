'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Navigation, WifiOff } from 'lucide-react'
import { openDB } from 'idb'

const DB_NAME      = 'aksara-location-buffer'
const DB_STORE     = 'pending_pings'
const PING_INTERVAL_MS  = 12000   // 12 seconds
const MIN_DISTANCE_M    = 25      // 25 metres
const STALE_WARN_MIN    = 5

interface PendingPing {
  trip_id:    string
  driver_id:  string
  lat:        number
  lng:        number
  accuracy:   number | null
  speed:      number | null
  heading:    number | null
  recorded_at: string
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

async function getBuffer() {
  return openDB(DB_NAME, 1, {
    upgrade(db) { db.createObjectStore(DB_STORE, { autoIncrement: true }) }
  })
}

async function bufferPing(ping: PendingPing) {
  const db = await getBuffer()
  await db.add(DB_STORE, ping)
}

async function flushBuffer(supabase: ReturnType<typeof createClient>) {
  const db = await getBuffer()
  const tx = db.transaction(DB_STORE, 'readwrite')
  const keys = await tx.store.getAllKeys()
  const pings = await tx.store.getAll()
  if (!pings.length) return

  // Upsert latest position
  const latest = pings[pings.length - 1] as PendingPing
  const { error: upsertErr } = await supabase.from('driver_locations').upsert({
    driver_id:  latest.driver_id,
    trip_id:    latest.trip_id,
    lat:        latest.lat,
    lng:        latest.lng,
    accuracy:   latest.accuracy,
    speed:      latest.speed,
    heading:    latest.heading,
    recorded_at: latest.recorded_at,
  }, { onConflict: 'driver_id' })

  if (upsertErr) return

  // Append all buffered pings to history
  await supabase.from('location_history').insert(
    (pings as PendingPing[]).map(p => ({
      trip_id:    p.trip_id,
      driver_id:  p.driver_id,
      lat:        p.lat,
      lng:        p.lng,
      accuracy:   p.accuracy,
      speed:      p.speed,
      heading:    p.heading,
      recorded_at: p.recorded_at,
    }))
  )

  // Clear flushed pings
  const clearTx = db.transaction(DB_STORE, 'readwrite')
  for (const key of keys) await clearTx.store.delete(key)
  await clearTx.done
}

interface Props {
  tripId:   string
  driverId: string
  active:   boolean
  onStop:   () => void
}

export default function LocationTracker({ tripId, driverId, active, onStop }: Props) {
  const [status, setStatus]   = useState<'acquiring' | 'active' | 'offline' | 'denied' | 'error'>('acquiring')
  const [lastPing, setLastPing] = useState<Date | null>(null)
  const watchIdRef    = useRef<number | null>(null)
  const lastPosRef    = useRef<{ lat: number; lng: number } | null>(null)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingPingRef = useRef<PendingPing | null>(null)
  const supabase = createClient()

  // Also update trip status to in_transit on first successful ping
  const tripStartedRef = useRef(false)

  const sendPing = useCallback(async (ping: PendingPing) => {
    const online = navigator.onLine

    if (!online) {
      setStatus('offline')
      await bufferPing(ping)
      return
    }

    try {
      await flushBuffer(supabase)

      await supabase.from('driver_locations').upsert({
        driver_id:   ping.driver_id,
        trip_id:     ping.trip_id,
        lat:         ping.lat,
        lng:         ping.lng,
        accuracy:    ping.accuracy,
        speed:       ping.speed,
        heading:     ping.heading,
        recorded_at: ping.recorded_at,
      }, { onConflict: 'driver_id' })

      await supabase.from('location_history').insert({
        trip_id:     ping.trip_id,
        driver_id:   ping.driver_id,
        lat:         ping.lat,
        lng:         ping.lng,
        accuracy:    ping.accuracy,
        speed:       ping.speed,
        heading:     ping.heading,
        recorded_at: ping.recorded_at,
      })

      if (!tripStartedRef.current) {
        await supabase.from('trips').update({ status: 'in_transit' }).eq('id', tripId)
        tripStartedRef.current = true
      }

      setStatus('active')
      setLastPing(new Date())
    } catch {
      await bufferPing(ping)
      setStatus('offline')
    }
  }, [supabase, tripId])

  useEffect(() => {
    if (!active) return

    if (!navigator.geolocation) {
      setStatus('error')
      return
    }

    // Interval flush for time-based pings
    intervalRef.current = setInterval(() => {
      if (pendingPingRef.current) {
        sendPing(pendingPingRef.current)
        pendingPingRef.current = null
      }
    }, PING_INTERVAL_MS)

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy, speed, heading } = pos.coords
        const now = new Date().toISOString()
        const ping: PendingPing = { trip_id: tripId, driver_id: driverId, lat, lng, accuracy, speed, heading, recorded_at: now }

        // Distance-based trigger
        const last = lastPosRef.current
        if (!last || haversineMeters(last.lat, last.lng, lat, lng) >= MIN_DISTANCE_M) {
          sendPing(ping)
          lastPosRef.current = { lat, lng }
        } else {
          // Queue for interval flush
          pendingPingRef.current = ping
        }
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied')
        else setStatus('error')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )

    // Online recovery
    function handleOnline() {
      flushBuffer(supabase).then(() => setStatus('active'))
    }
    window.addEventListener('online', handleOnline)

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('online', handleOnline)
    }
  }, [active, tripId, driverId, sendPing, supabase])

  const bannerClasses = {
    acquiring: 'bg-blue-50 text-blue-700',
    active:    'bg-green-50 text-green-700',
    offline:   'bg-yellow-50 text-yellow-700',
    denied:    'bg-red-50 text-red-700',
    error:     'bg-red-50 text-red-700',
  }

  const messages = {
    acquiring: 'Mendapatkan sinyal GPS...',
    active:    t.locationActive,
    offline:   'Offline — lokasi disimpan lokal, akan dikirim saat online',
    denied:    t.locationPermissionDenied,
    error:     t.locationUnavailable,
  }

  return (
    <div className={`rounded-lg p-3 flex items-center gap-3 text-sm ${bannerClasses[status]}`}>
      {status === 'offline'
        ? <WifiOff className="h-4 w-4 shrink-0" />
        : <Navigation className={`h-4 w-4 shrink-0 ${status === 'active' ? 'animate-pulse' : ''}`} />
      }
      <div className="flex-1">
        <p className="font-medium">{messages[status]}</p>
        {lastPing && status === 'active' && (
          <p className="text-xs opacity-70">
            Terakhir: {lastPing.toLocaleTimeString('id-ID')}
          </p>
        )}
      </div>
    </div>
  )
}
