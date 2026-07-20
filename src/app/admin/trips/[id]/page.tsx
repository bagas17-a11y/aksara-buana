import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TripStatus } from '@/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import TripStatusActions from '@/components/trip/TripStatusActions'
import WhatsAppReminder from '@/components/trip/WhatsAppReminder'
import ChecklistAnswersSection from '@/components/admin/ChecklistAnswersSection'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

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

  const [{ data: trip }, { data: templates }] = await Promise.all([
    supabase
      .from('trips')
      .select('*, driver:profiles!driver_id(*), stops:trip_stops(*), checklist_submissions(*), attachments(*)')
      .eq('id', id)
      .single(),
    supabase.from('checklist_templates').select('*').eq('active', true),
  ])

  if (!trip) notFound()

  const driver      = trip.driver as { full_name: string; vehicle_plate: string | null; phone: string | null }
  const stops       = (trip.stops as { id: string; sequence: number; label: string; address: string; status: string; delivered_at: string | null }[]) ?? []
  const submissions = (trip.checklist_submissions as { id: string; type: string; submitted_at: string; answers: Record<string, unknown> }[]) ?? []

  const preCheck  = submissions.find(s => s.type === 'pre')
  const postCheck = submissions.find(s => s.type === 'post')

  const preTemplate  = templates?.find(t => t.type === 'pre')
  const postTemplate = templates?.find(t => t.type === 'post')

  // Completion time = latest stop delivered_at
  const deliveredTimes = stops.map(s => s.delivered_at).filter(Boolean) as string[]
  const completedAt = deliveredTimes.length ? deliveredTimes.sort().at(-1)! : null

  // Signed URL for tanda penerima photo (1 hour)
  let tandaPenerimaUrl: string | null = null
  const photoPath = postCheck?.answers?.tanda_penerima_path as string | undefined
  if (photoPath) {
    const { data: signed } = await supabase.storage.from('attachments').createSignedUrl(photoPath, 3600)
    tandaPenerimaUrl = signed?.signedUrl ?? null
  }

  const isEditable = !['delivered', 'completed', 'cancelled'].includes(trip.status)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Detail Perjalanan</h1>
          <p className="text-sm text-muted-foreground">ID: {trip.id.slice(0, 8)}…</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <Link href={`/admin/trips/${trip.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
          )}
          <Badge variant="default" className="text-sm py-1 px-3">
            {statusLabels[trip.status as TripStatus]}
          </Badge>
        </div>
      </div>

      {completedAt && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            ✓ Selesai diantar pada{' '}
            <span className="font-bold">
              {format(new Date(completedAt), 'dd MMM yyyy HH:mm', { locale: idLocale })} WIB
            </span>
          </p>
        </div>
      )}

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
              stops={stops.sort((a, b) => a.sequence - b.sequence).map(s => ({ label: s.label, address: s.address }))}
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
        <p><span className="text-muted-foreground w-28 inline-block">Dibuat</span>
          {format(new Date(trip.scheduled_at), 'dd MMM yyyy HH:mm', { locale: idLocale })} WIB
        </p>
        {trip.notes && <p><span className="text-muted-foreground w-28 inline-block">Catatan</span>{trip.notes}</p>}
      </section>

      {/* Stops */}
      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Tujuan Pengantaran</h2>
        <div className="space-y-2">
          {stops.sort((a, b) => a.sequence - b.sequence).map(stop => (
            <div key={stop.id} className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-5">{stop.sequence}.</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{stop.label}</p>
                <p className="text-sm text-muted-foreground">{stop.address}</p>
                {stop.delivered_at && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Selesai {format(new Date(stop.delivered_at), 'HH:mm', { locale: idLocale })} WIB
                  </p>
                )}
              </div>
              <Badge variant={stop.status === 'delivered' ? 'secondary' : 'outline'} className="text-xs">
                {stop.status === 'delivered' ? t.stopDelivered : t.stopPending}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist submissions */}
      <section className="border rounded-lg p-4 space-y-5">
        <h2 className="font-semibold">Checklist Sopir</h2>

        {/* Pre-trip */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sebelum Pengiriman</span>
            <Badge variant={preCheck ? 'default' : 'outline'} className="text-xs">
              {preCheck ? `Selesai ${format(new Date(preCheck.submitted_at), 'HH:mm', { locale: idLocale })} WIB` : 'Belum'}
            </Badge>
          </div>
          {preCheck && preTemplate && (
            <ChecklistAnswersSection
              title="Sebelum Pengiriman"
              fields={preTemplate.fields}
              answers={preCheck.answers}
              submittedAt={preCheck.submitted_at}
            />
          )}
        </div>

        <div className="border-t" />

        {/* Post-trip */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Setelah Pengiriman</span>
            <Badge variant={postCheck ? 'default' : 'outline'} className="text-xs">
              {postCheck ? `Selesai ${format(new Date(postCheck.submitted_at), 'HH:mm', { locale: idLocale })} WIB` : 'Belum'}
            </Badge>
          </div>
          {postCheck && postTemplate && (
            <ChecklistAnswersSection
              title="Setelah Pengiriman"
              fields={postTemplate.fields}
              answers={postCheck.answers}
              submittedAt={postCheck.submitted_at}
              photoUrl={tandaPenerimaUrl}
              photoLabel="Foto Tanda Penerima"
            />
          )}
        </div>
      </section>

      <TripStatusActions trip={trip} />
    </div>
  )
}
