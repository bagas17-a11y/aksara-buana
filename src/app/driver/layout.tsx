import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DriverNav from '@/components/shared/DriverNav'
import PwaInstallBanner from '@/components/shared/PwaInstallBanner'
import PushSubscriber from '@/components/shared/PushSubscriber'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PushSubscriber />
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <DriverNav />
      <PwaInstallBanner />
    </div>
  )
}
