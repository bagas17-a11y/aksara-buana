import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { TripStatus } from '@/types'
import AutoRefresh from '@/components/shared/AutoRefresh'

export const dynamic = 'force-dynamic'

const statusLabels: Record<TripStatus, string> = {
  assigned:       t.statusAssigned,
  pre_check_done: t.statusPreCheckDone,
  in_transit:     t.statusInTransit,
  delivered:      t.statusDelivered,
  completed:      t.statusCompleted,
  cancelled:      t.statusCancelled,
}

const statusVariant: Record<TripStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  assigned:       'outline',
  pre_check_done: 'secondary',
  in_transit:     'default',
  delivered:      'default',
  completed:      'secondary',
  cancelled:      'destructive',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ data: trips }, { data: activeLocations }] = await Promise.all([
    supabase
      .from('trips')
      .select('*, driver:profiles!driver_id(full_name, vehicle_plate), stops:trip_stops(*)')
      .gte('scheduled_at', today.toISOString())
      .order('scheduled_at'),
    supabase
      .from('driver_locations')
      .select('*, driver:profiles!driver_id(full_name)')
      .gte('recorded_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
  ])

  const activeTrips   = trips?.filter(t => t.status === 'in_transit') ?? []
  const pendingTrips  = trips?.filter(t => ['assigned','pre_check_done'].includes(t.status)) ?? []
  const completedToday = trips?.filter(t => ['delivered', 'completed'].includes(t.status)) ?? []

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />
      <h1 className="text-2xl font-bold">{t.navDashboard}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.activeDrivers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeLocations?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalTripsToday}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{trips?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.pendingTrips}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingTrips.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.completedToday}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedToday.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Perjalanan Aktif</h2>
          <Link href="/admin/trips" className="text-sm text-primary hover:underline">
            Lihat semua →
          </Link>
        </div>
        {activeTrips.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t.noActiveDrivers}</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <Link key={trip.id} href={`/admin/trips/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{(trip.driver as {full_name:string})?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{trip.cargo_desc} → {trip.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={statusVariant[trip.status as TripStatus]}>
                        {statusLabels[trip.status as TripStatus]}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(trip.scheduled_at), { addSuffix: true, locale: idLocale })}
                      </p>
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
