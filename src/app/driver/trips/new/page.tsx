import { createClient } from '@/lib/supabase/server'
import DriverCreateTripForm from '@/components/trip/DriverCreateTripForm'

export const dynamic = 'force-dynamic'

export default async function DriverNewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, vehicle_plate')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tambah Pengantaran</h1>
      <DriverCreateTripForm driverId={user!.id} driverName={profile?.full_name ?? ''} />
    </div>
  )
}
