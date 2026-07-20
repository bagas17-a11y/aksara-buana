// Run: node scripts/create-users.mjs
// Creates all Aksara Buana staff accounts in Supabase Auth + profiles table

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xsyjoelzodydlgpzoifa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'KurirAB!'

function normalise(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  return '62' + digits
}

function toEmail(phone) {
  return `${normalise(phone)}@aksarabuana.id`
}

const users = [
  // Car drivers
  { name: 'Ujang',    phone: '085211273815', role: 'driver', vehicle_type: 'car' },
  { name: 'Jamal',    phone: '081399475555', role: 'driver', vehicle_type: 'car' },
  { name: 'Zakaria',  phone: '087741332997', role: 'driver', vehicle_type: 'car' },

  // Motorcycle drivers
  { name: 'Surono',   phone: '081383296690', role: 'driver', vehicle_type: 'motorcycle' },
  { name: 'Nardi',    phone: '085771033012', role: 'driver', vehicle_type: 'motorcycle' },
  { name: 'Doel',     phone: '08159693435',  role: 'driver', vehicle_type: 'motorcycle' },
  { name: 'Fitra',    phone: '085814852357', role: 'driver', vehicle_type: 'motorcycle' },
  { name: 'Surahmin', phone: '081329041177', role: 'driver', vehicle_type: 'motorcycle' },

  // Admins
  { name: 'Puji',     phone: '081380600075',  role: 'admin', vehicle_type: null },
  { name: 'Fauzan',   phone: '0895337853689', role: 'admin', vehicle_type: null },
  { name: 'Zahra',    phone: '087778503082',  role: 'admin', vehicle_type: null },
  { name: 'Candra',   phone: '081351938440',  role: 'admin', vehicle_type: null },
  { name: 'Vera',     phone: '085885182140',  role: 'admin', vehicle_type: null },
  { name: 'Widodo',   phone: '87781888221',   role: 'admin', vehicle_type: null },
]

for (const u of users) {
  const email = toEmail(u.phone)
  process.stdout.write(`Creating ${u.name} (${email})... `)

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('already exists, updating profile...')
      // Still upsert profile in case it's missing
      const { data: existing } = await admin.auth.admin.listUsers()
      const existingUser = existing?.users?.find(u2 => u2.email === email)
      if (existingUser) {
        await admin.from('profiles').upsert({
          id: existingUser.id,
          full_name: u.name,
          role: u.role,
          phone: normalise(u.phone),
          vehicle_type: u.vehicle_type,
          active: true,
        }, { onConflict: 'id' })
      }
    } else {
      console.log(`ERROR: ${authError.message}`)
    }
    continue
  }

  // Upsert profile
  const { error: profileError } = await admin.from('profiles').upsert({
    id: authData.user.id,
    full_name: u.name,
    role: u.role,
    phone: normalise(u.phone),
    vehicle_type: u.vehicle_type,
    active: true,
  }, { onConflict: 'id' })

  if (profileError) {
    console.log(`created auth but profile failed: ${profileError.message}`)
  } else {
    console.log('✓')
  }
}

console.log('\nDone. All users can log in with their phone number and password: KurirAB!')
