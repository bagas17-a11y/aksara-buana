import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, full_name, phone, vehicle_plate } = await req.json()
  if (!email || !full_name) {
    return NextResponse.json({ error: 'Email dan nama wajib diisi.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Send invite email — driver will receive a link to set their password
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role: 'driver' },
  })

  if (error) {
    // "User already registered" is the most common case
    if (error.message.includes('already')) {
      return NextResponse.json({ error: 'Email sudah terdaftar di sistem.' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Upsert profile with full details using the returned UUID
  await admin.from('profiles').upsert({
    id: data.user.id,
    full_name,
    role: 'driver',
    phone: phone || null,
    vehicle_plate: vehicle_plate || null,
    active: true,
  })

  return NextResponse.json({ success: true })
}
