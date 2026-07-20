import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripDetailClient from '@/components/trip/TripDetailClient'

export const dynamic = 'force-dynamic'

export default async function DriverTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from('trips')
    .select('*, stops:trip_stops(*)')
    .eq('id', id)
    .eq('driver_id', user!.id)
    .single()

  if (!trip) notFound()

  // Get active checklist templates
  const [{ data: preTemplate }, { data: postTemplate }] = await Promise.all([
    supabase.from('checklist_templates').select('*').eq('type', 'pre').eq('active', true).limit(1).single(),
    supabase.from('checklist_templates').select('*').eq('type', 'post').eq('active', true).limit(1).single(),
  ])

  // Check existing submissions
  const { data: submissions } = await supabase
    .from('checklist_submissions')
    .select('*')
    .eq('trip_id', id)
    .eq('driver_id', user!.id)

  const preSubmission  = submissions?.find(s => s.type === 'pre')  ?? null
  const postSubmission = submissions?.find(s => s.type === 'post') ?? null

  return (
    <TripDetailClient
      trip={trip}
      driverId={user!.id}
      preTemplate={preTemplate ?? null}
      postTemplate={postTemplate ?? null}
      preSubmission={preSubmission}
      postSubmission={postSubmission}
    />
  )
}
