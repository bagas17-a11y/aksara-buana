import { createClient } from '@/lib/supabase/server'
import LiveMapWrapper from '@/components/map/LiveMapWrapper'

export const dynamic = 'force-dynamic'

export default async function DriverMapPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('driver_locations')
    .select('*, driver:profiles!driver_id(full_name, vehicle_plate), trip:trips!trip_id(id, status, cargo_desc, customer_name, stops:trip_stops(*))')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Peta Sopir Aktif</h1>
      <p className="text-sm text-muted-foreground">Posisi real-time semua sopir yang sedang bertugas.</p>
      <LiveMapWrapper initialLocations={locations ?? []} activeTrips={[]} />
    </div>
  )
}
