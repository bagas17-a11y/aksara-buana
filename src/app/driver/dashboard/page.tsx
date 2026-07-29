import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { fmtDateFull, fmtDateTimeLong } from '@/lib/date'
import { TripStatus } from '@/types'
import { ChevronRight } from 'lucide-react'

const statusLabels: Record<TripStatus, string> = {
  assigned:       t.statusAssigned,
  pre_check_done: t.statusPreCheckDone,
  in_transit:     t.statusInTransit,
  delivered:      t.statusDelivered,
  at_office:      t.statusAtOffice,
  completed:      t.statusCompleted,
  cancelled:      t.statusCancelled,
}

export const dynamic = 'force-dynamic'

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, stops:trip_stops(*)')
    .eq('driver_id', user!.id)
    .not('status', 'in', '("completed","cancelled")')
    .order('scheduled_at')

  const activeTrip = trips?.find(t => t.status === 'in_transit')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Halo, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Hari ini: {fmtDateFull(new Date().toISOString())}</p>
      </div>

      {activeTrip && (
        <div className="bg-primary text-primary-foreground rounded-xl p-4">
          <p className="text-sm font-medium opacity-90 mb-1">Perjalanan Aktif</p>
          <p className="font-bold text-lg">{activeTrip.cargo_desc}</p>
          <p className="text-sm opacity-80">{activeTrip.customer_name}</p>
          <Link
            href={`/driver/trips/${activeTrip.id}`}
            className="mt-3 flex items-center gap-1 text-sm font-medium bg-white/20 rounded-lg px-3 py-2 w-fit"
          >
            Lihat Detail <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">{t.myTrips}</h2>
        {!trips?.length ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">{t.noTrips}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <Link key={trip.id} href={`/driver/trips/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                  <CardContent className="py-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{trip.cargo_desc}</p>
                      <p className="text-sm text-muted-foreground">{trip.customer_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmtDateTimeLong(trip.scheduled_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[trip.status as TripStatus]}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
