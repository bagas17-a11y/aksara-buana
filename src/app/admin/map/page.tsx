import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import LiveMapWrapper from '@/components/map/LiveMapWrapper'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('driver_locations')
    .select('*, driver:profiles!driver_id(full_name, vehicle_plate), trip:trips!trip_id(id, status, cargo_desc, customer_name, stops:trip_stops(*))')

  const { data: activeTrips } = await supabase
    .from('trips')
    .select('*, driver:profiles!driver_id(full_name, vehicle_plate), stops:trip_stops(*)')
    .in('status', ['in_transit', 'pre_check_done', 'assigned'])
    .order('scheduled_at')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.mapTitle}</h1>
        <Link href="/admin/trips/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Buat Pengantaran</Button>
        </Link>
      </div>
      <LiveMapWrapper initialLocations={locations ?? []} activeTrips={activeTrips ?? []} />
    </div>
  )
}
