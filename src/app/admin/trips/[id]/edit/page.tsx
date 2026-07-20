import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditTripForm from '@/components/trip/EditTripForm'

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: trip }, { data: drivers }] = await Promise.all([
    supabase.from('trips').select('*, stops:trip_stops(*)').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name, vehicle_plate, vehicle_type').eq('role', 'driver').eq('active', true).order('full_name'),
  ])

  if (!trip) notFound()

  const stops = ((trip.stops ?? []) as { id: string; sequence: number; label: string; address: string; status: string }[])
    .sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Pengantaran</h1>
      <EditTripForm
        trip={{
          id: trip.id,
          driver_id: trip.driver_id,
          cargo_desc: trip.cargo_desc,
          customer_name: trip.customer_name,
          customer_phone: trip.customer_phone,
          notes: trip.notes,
          status: trip.status,
        }}
        stops={stops}
        drivers={drivers ?? []}
      />
    </div>
  )
}
