'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { DriverLocation, Trip } from '@/types'
import { t } from '@/lib/i18n'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import AddStopDialog from '@/components/trip/AddStopDialog'

// Dynamically import the Leaflet map (no SSR — Leaflet requires window)
const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false, loading: () => (
  <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center text-muted-foreground">
    {t.loading}
  </div>
) })

interface Props {
  initialLocations: DriverLocation[]
  activeTrips: Trip[]
}

export default function LiveMapWrapper({ initialLocations, activeTrips }: Props) {
  const [locations, setLocations] = useState<DriverLocation[]>(initialLocations)
  const [selected, setSelected] = useState<DriverLocation | null>(null)
  const [addStopOpen, setAddStopOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('driver-locations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        async () => {
          // Re-fetch the full joined row on any change
          const { data } = await supabase
            .from('driver_locations')
            .select('*, driver:profiles!driver_id(full_name, vehicle_plate), trip:trips!trip_id(id, status, cargo_desc, customer_name, stops:trip_stops(*))')
          if (data) setLocations(data)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const staleThresholdMs = 5 * 60 * 1000 // 5 minutes

  function isStale(loc: DriverLocation) {
    return Date.now() - new Date(loc.recorded_at).getTime() > staleThresholdMs
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Map */}
      <div className="lg:col-span-2 h-[600px] rounded-lg overflow-hidden border shadow-sm">
        <LiveMap
          locations={locations}
          onSelectDriver={setSelected}
          selectedDriverId={selected?.driver_id ?? null}
        />
      </div>

      {/* Driver list */}
      <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">{t.noActiveDrivers}</p>
        ) : (
          locations.map(loc => {
            const stale = isStale(loc)
            const driver = loc.driver as {full_name: string; vehicle_plate: string | null} | undefined
            return (
              <div
                key={loc.driver_id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected?.driver_id === loc.driver_id ? 'border-primary bg-primary/5' : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelected(loc)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{driver?.full_name}</p>
                    {driver?.vehicle_plate && (
                      <p className="text-xs text-muted-foreground">{driver.vehicle_plate}</p>
                    )}
                  </div>
                  <Badge variant={stale ? 'secondary' : 'default'} className="text-xs shrink-0">
                    {stale ? 'Stale' : 'Live'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.lastSeen}: {formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true, locale: idLocale })}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Driver side panel */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selected && (() => {
            const driver = selected.driver as {full_name: string; vehicle_plate: string | null} | undefined
            const trip = selected.trip as Trip | undefined
            const stale = isStale(selected)
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{driver?.full_name}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {driver?.vehicle_plate && (
                    <p className="text-sm text-muted-foreground">Kendaraan: {driver.vehicle_plate}</p>
                  )}

                  <div className={`flex items-center gap-2 text-sm p-2 rounded ${stale ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${stale ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
                    {stale
                      ? `${t.locationStale} ${formatDistanceToNow(new Date(selected.recorded_at), { locale: idLocale })}`
                      : t.locationActive}
                  </div>

                  {trip && (
                    <div className="space-y-2 border rounded-lg p-3">
                      <p className="text-sm font-medium">{t.currentTrip}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Muatan:</span> {trip.cargo_desc}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Pelanggan:</span> {trip.customer_name}</p>
                      {trip.stops && trip.stops.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mt-2 mb-1">{t.stops}</p>
                          {trip.stops.map((stop, i) => (
                            <div key={stop.id} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{i + 1}.</span>
                              <span>{stop.label}</span>
                              <Badge variant={stop.status === 'delivered' ? 'secondary' : 'outline'} className="text-xs ml-auto">
                                {stop.status === 'delivered' ? t.stopDelivered : t.stopPending}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => setAddStopOpen(true)}
                      >
                        {t.addFollowUp}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {selected?.trip && (
        <AddStopDialog
          open={addStopOpen}
          onOpenChange={setAddStopOpen}
          tripId={(selected.trip as Trip).id}
        />
      )}
    </div>
  )
}
