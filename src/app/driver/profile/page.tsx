import { createClient } from '@/lib/supabase/server'
import DriverProfileForm from '@/components/drivers/DriverProfileForm'

export const dynamic = 'force-dynamic'

export default async function DriverProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile) return <p className="p-4">Profil tidak ditemukan.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profil Saya</h1>
      <DriverProfileForm profile={profile} />
    </div>
  )
}
