import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { TripStatus } from '@/types'
import { Plus } from 'lucide-react'
import AutoRefresh from '@/components/shared/AutoRefresh'

export const dynamic = 'force-dynamic'

const statusLabels: Record<TripStatus, string> = {
  assigned:       t.statusAssigned,
  pre_check_done: t.statusPreCheckDone,
  in_transit:     t.statusInTransit,
  delivered:      t.statusDelivered,
  at_office:      t.statusAtOffice,
  completed:      t.statusCompleted,
  cancelled:      t.statusCancelled,
}

const statusVariant: Record<TripStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  assigned:       'outline',
  pre_check_done: 'secondary',
  in_transit:     'default',
  delivered:      'default',
  at_office:      'secondary',
  completed:      'secondary',
  cancelled:      'destructive',
}

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: trips } = await supabase
    .from('trips')
    .select('*, driver:profiles!driver_id(full_name), stops:trip_stops(id, delivered_at, status)')
    .order('scheduled_at', { ascending: false })

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={30000} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.navTrips}</h1>
        <Link href="/admin/trips/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t.createTrip}
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Sopir</th>
              <th className="px-4 py-3 font-medium">Muatan</th>
              <th className="px-4 py-3 font-medium">{t.customer}</th>
              <th className="px-4 py-3 font-medium">{t.stops}</th>
              <th className="px-4 py-3 font-medium">Selesai</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!trips?.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t.noTrips}</td></tr>
            )}
            {trips?.map(trip => {
              const stops = (trip.stops as { id: string; delivered_at: string | null; status: string }[]) ?? []
              const deliveredTimes = stops.map(s => s.delivered_at).filter(Boolean) as string[]
              const completedAt = deliveredTimes.length ? deliveredTimes.sort().at(-1)! : null
              return (
                <tr key={trip.id} className="border-b hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/admin/trips/${trip.id}`} className="block">
                      {format(new Date(trip.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/trips/${trip.id}`} className="block">
                      {(trip.driver as { full_name: string })?.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <Link href={`/admin/trips/${trip.id}`} className="block">{trip.cargo_desc}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/trips/${trip.id}`} className="block">{trip.customer_name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/trips/${trip.id}`} className="block">{stops.length}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {completedAt
                      ? <Link href={`/admin/trips/${trip.id}`} className="block">{format(new Date(completedAt), 'dd MMM HH:mm', { locale: idLocale })}</Link>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[trip.status as TripStatus]}>
                      {statusLabels[trip.status as TripStatus]}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
