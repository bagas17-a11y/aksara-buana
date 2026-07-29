'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface Stop { label: string; address: string }

export async function createDriverTrip(payload: {
  customerName: string
  customerPhone: string | null
  cargoDesc: string
  notes: string | null
  stops: Stop[]
}): Promise<{ tripId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi.' }

  const admin = createAdminClient()

  const { data: trip, error } = await admin
    .from('trips')
    .insert({
      driver_id:      user.id,
      dispatcher_id:  user.id,
      cargo_desc:     payload.cargoDesc || 'Cetakan',
      customer_name:  payload.customerName,
      customer_phone: payload.customerPhone || null,
      scheduled_at:   new Date().toISOString(),
      notes:          payload.notes || null,
      status:         'assigned',
    })
    .select('id')
    .single()

  if (error || !trip) return { error: 'Gagal membuat pengantaran.' }

  const { error: stopsErr } = await admin.from('trip_stops').insert(
    payload.stops.map((s, i) => ({
      trip_id:  trip.id,
      sequence: i + 1,
      label:    s.label,
      address:  s.address,
      status:   'pending',
    }))
  )

  if (stopsErr) {
    await admin.from('trips').delete().eq('id', trip.id)
    return { error: 'Gagal menyimpan tujuan.' }
  }

  return { tripId: trip.id }
}
