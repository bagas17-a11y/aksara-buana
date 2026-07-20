import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { TripStatus } from '@/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import TripStatusActions from '@/components/trip/TripStatusActions'
import WhatsAppReminder from '@/components/trip/WhatsAppReminder'

const statusLabels: Record<TripStatus, string> = {
  assigned:       t.statusAssigned,
  pre_check_done: t.statusPreCheckDone,
  in_transit:     t.statusInTransit,
  delivered:      t.statusDelivered,
  completed:      t.statusCompleted,
  cancelled:      t.statusCancelled,
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*, driver:profiles!driver_id(*), stops:trip_stops(*), checklist_submissions(*), attachments(*)')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const driver = trip.driver as {full_name: string; vehicle_plate: string | null; phone: string | null}
  const stops  = (trip.stops as {id:string; sequence:number; label:string; address:string; status:string; delivered_at:string|null}[]) ?? []
  const submissions = (trip.checklist_submissions as {id:string; type:string; submitted_at:string}[]) ?? []

  const preCheck  = submissions.find(s => s.type === 'pre')
  const postCheck = submissions.find(s => s.type === 'post')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Detail Perjalanan</h1>
          <p className="text-sm text-muted-foreground">ID: {trip.id.slice(0, 8)}…</p>
        </div>
        <Badge variant="default" className="text-sm py-1 px-3">
          {statusLabels[trip.status as TripStatus]}
        </Badge>
      </div>

      {/* Driver info */}
      <section className="border rounded-lg p-4 space-y-1">
        <h2 className="font-semibold mb-2">Sopir</h2>
        <p><span className="text-muted-foreground w-28 inline-block">Nama</span>{driver.full_name}</p>
        {driver.vehicle_plate && <p><span className="text-muted-foreground w-28 inline-block">Kendaraan</span>{driver.vehicle_plate}</p>}
        {driver.phone && (
          <div className="flex items-center gap-3">
            <p className="flex-1"><span className="text-muted-foreground w-28 inline-block">No. HP</span>{driver.phone}</p>
            <WhatsAppReminder
              phone={driver.phone}
              driverName={driver.full_name}
              stops={stops.sort((a,b) => a.sequence - b.sequence).map(s => ({ label: s.label, address: s.address }))}
              scheduledAt={format(new Date(trip.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
              cargoDesc={trip.cargo_desc}
            />
          </div>
        )}
      </section>

      {/* Trip info */}
      <section className="border rounded-lg p-4 space-y-1">
        <h2 className="font-semibold mb-2">Informasi Pengantaran</h2>
        <p><span className="text-muted-foreground w-28 inline-block">Muatan</span>{trip.cargo_desc}</p>
        <p><span className="text-muted-foreground w-28 inline-block">Pelanggan</span>{trip.customer_name}</p>
        {trip.customer_phone && <p><span className="text-muted-foreground w-28 inline-block">No. HP</span>{trip.customer_phone}</p>}
        <p><span className="text-muted-foreground w-28 inline-block">Jadwal</span>
          {format(new Date(trip.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })} WIB
        </p>
        {trip.notes && <p><span className="text-muted-foreground w-28 inline-block">Catatan</span>{trip.notes}</p>}
      </section>

      {/* Stops */}
      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Tujuan Pengantaran</h2>
        <div className="space-y-2">
          {stops.sort((a,b) => a.sequence - b.sequence).map(stop => (
            <div key={stop.id} className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-5">{stop.sequence}.</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{stop.label}</p>
                <p className="text-sm text-muted-foreground">{stop.address}</p>
              </div>
              <Badge variant={stop.status === 'delivered' ? 'secondary' : 'outline'} className="text-xs">
                {stop.status === 'delivered' ? t.stopDelivered : t.stopPending}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist status */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold mb-2">Checklist</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm w-40">Cek Pra-Perjalanan</span>
          <Badge variant={preCheck ? 'default' : 'outline'}>
            {preCheck ? `Selesai — ${format(new Date(preCheck.submitted_at), 'HH:mm', { locale: idLocale })}` : 'Belum'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm w-40">Cek Pasca-Pengantaran</span>
          <Badge variant={postCheck ? 'default' : 'outline'}>
            {postCheck ? `Selesai — ${format(new Date(postCheck.submitted_at), 'HH:mm', { locale: idLocale })}` : 'Belum'}
          </Badge>
        </div>
      </section>

      <TripStatusActions trip={trip} />
    </div>
  )
}
