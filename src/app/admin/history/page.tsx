import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { TripStatus } from '@/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'
import CsvExportButton from '@/components/shared/CsvExportButton'

export const dynamic = 'force-dynamic'

const statusLabels: Record<TripStatus, string> = {
  assigned:       t.statusAssigned,
  pre_check_done: t.statusPreCheckDone,
  in_transit:     t.statusInTransit,
  delivered:      t.statusDelivered,
  completed:      t.statusCompleted,
  cancelled:      t.statusCancelled,
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; driver?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('trips')
    .select('*, driver:profiles!driver_id(full_name), stops:trip_stops(*)')
    .order('scheduled_at', { ascending: false })
    .limit(100)

  if (params.status) query = query.eq('status', params.status)
  if (params.driver) query = query.eq('driver_id', params.driver)
  if (params.from)   query = query.gte('scheduled_at', new Date(params.from).toISOString())
  if (params.to)     query = query.lte('scheduled_at', new Date(params.to + 'T23:59:59').toISOString())

  const { data: trips } = await query
  const { data: drivers } = await supabase.from('profiles').select('id, full_name').eq('role', 'driver').order('full_name')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.historyTitle}</h1>
        <CsvExportButton trips={trips ?? []} />
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-end" method="GET">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Dari</label>
          <input name="from" type="date" defaultValue={params.from ?? ''} className="border rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Sampai</label>
          <input name="to" type="date" defaultValue={params.to ?? ''} className="border rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t.filterByDriver}</label>
          <select name="driver" defaultValue={params.driver ?? ''} className="border rounded-md px-3 py-2 text-sm">
            <option value="">{t.allDrivers}</option>
            {drivers?.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t.filterByStatus}</label>
          <select name="status" defaultValue={params.status ?? ''} className="border rounded-md px-3 py-2 text-sm">
            <option value="">{t.allStatuses}</option>
            {(Object.keys(statusLabels) as TripStatus[]).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium h-[38px]">
          Filter
        </button>
        <Link href="/admin/history" className="px-4 py-2 border rounded-md text-sm h-[38px] flex items-center">Reset</Link>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium">{t.scheduled}</th>
              <th className="px-4 py-3 font-medium">Sopir</th>
              <th className="px-4 py-3 font-medium">Muatan</th>
              <th className="px-4 py-3 font-medium">{t.customer}</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!trips?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t.noHistory}</td></tr>
            )}
            {trips?.map(trip => (
              <tr key={trip.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/trips/${trip.id}`} className="hover:underline">
                    {format(new Date(trip.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                  </Link>
                </td>
                <td className="px-4 py-3">{(trip.driver as {full_name:string})?.full_name}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{trip.cargo_desc}</td>
                <td className="px-4 py-3">{trip.customer_name}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{statusLabels[trip.status as TripStatus]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
