'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, ChecklistTemplate, ChecklistSubmission, TripStop } from '@/types'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { MapPin, CheckCircle, Circle, Navigation } from 'lucide-react'
import PreTripChecklist from '@/components/checklist/PreTripChecklist'
import PostTripChecklist from '@/components/checklist/PostTripChecklist'
import LocationTracker from '@/components/map/LocationTracker'

interface Props {
  trip: Trip & { stops: TripStop[] }
  driverId: string
  preTemplate: ChecklistTemplate | null
  postTemplate: ChecklistTemplate | null
  preSubmission: ChecklistSubmission | null
  postSubmission: ChecklistSubmission | null
}

type View = 'detail' | 'pre_check' | 'post_check'

export default function TripDetailClient({
  trip, driverId, preTemplate, postTemplate, preSubmission, postSubmission
}: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('detail')
  const [isTracking, setIsTracking] = useState(trip.status === 'in_transit')

  const stops = (trip.stops ?? []).sort((a, b) => a.sequence - b.sequence)
  const pendingStop = stops.find(s => s.status !== 'delivered')

  const canStartTrip  = trip.status === 'pre_check_done'
  const canPostCheck  = trip.status === 'in_transit' && !postSubmission
  const isCompleted   = ['completed', 'cancelled'].includes(trip.status)

  if (view === 'pre_check' && preTemplate) {
    return (
      <PreTripChecklist
        template={preTemplate}
        trip={trip}
        driverId={driverId}
        onComplete={() => { router.refresh(); setView('detail') }}
        onBack={() => setView('detail')}
      />
    )
  }

  if (view === 'post_check' && postTemplate) {
    return (
      <PostTripChecklist
        template={postTemplate}
        trip={trip}
        driverId={driverId}
        currentStop={pendingStop ?? null}
        onComplete={() => { router.refresh(); setView('detail') }}
        onBack={() => setView('detail')}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Location tracker (hidden UI element, runs in background when active) */}
      {isTracking && (
        <LocationTracker
          tripId={trip.id}
          driverId={driverId}
          active={isTracking}
          onStop={() => setIsTracking(false)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">{trip.cargo_desc}</h1>
          <p className="text-sm text-muted-foreground">{trip.customer_name}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {trip.status}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Jadwal: {format(new Date(trip.scheduled_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
      </p>

      {/* Stops */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="font-semibold text-sm">{t.stops}</p>
          {stops.map((stop, i) => (
            <div key={stop.id} className="flex items-start gap-3">
              {stop.status === 'delivered'
                ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              }
              <div>
                <p className="font-medium text-sm">{stop.label}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{stop.address}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action area */}
      {!isCompleted && (
        <div className="space-y-3">
          {/* Step 1: Pre-trip checklist */}
          {trip.status === 'assigned' && !preSubmission && (
            <Button className="w-full h-14 text-base" onClick={() => setView('pre_check')}>
              {t.preCheckTitle} →
            </Button>
          )}

          {/* Pre-check done state */}
          {preSubmission && trip.status === 'pre_check_done' && !isTracking && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                {t.preCheckDone}
              </div>
              <Button
                className="w-full h-14 text-base gap-2"
                onClick={() => {
                  setIsTracking(true)
                  router.refresh()
                }}
              >
                <Navigation className="h-5 w-5" />
                {t.startTrip}
              </Button>
            </div>
          )}

          {/* In transit: show tracking indicator + post-check option */}
          {trip.status === 'in_transit' && (
            <div className="space-y-3">
              {!postSubmission && (
                <Button
                  className="w-full h-14 text-base"
                  variant="default"
                  onClick={() => setView('post_check')}
                >
                  {t.postCheckTitle} →
                </Button>
              )}
              {postSubmission && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  Cek pasca-pengantaran sudah dikirim.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          Perjalanan ini sudah selesai.
        </div>
      )}
    </div>
  )
}
