import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { TripStatus } from '@/types'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default async function DriverTripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, stops:trip_stops(*)')
    .eq('driver_id', user!.id)
    .order('scheduled_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.myTrips}</h1>
        <Link href="/driver/trips/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Tambah</Button>
        </Link>
      </div>
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
                      {format(new Date(trip.scheduled_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
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
  )
}
