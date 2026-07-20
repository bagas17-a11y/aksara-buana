import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { t } from '@/lib/i18n'
import CreateTripForm from '@/components/trip/CreateTripForm'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, full_name, vehicle_plate, vehicle_type, phone')
    .eq('role', 'driver')
    .eq('active', true)
    .order('full_name')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t.createTrip}</h1>
      <CreateTripForm drivers={drivers ?? []} dispatcherId={user!.id} />
    </div>
  )
}
