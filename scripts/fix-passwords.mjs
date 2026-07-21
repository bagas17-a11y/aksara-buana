// Run: node scripts/fix-passwords.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xsyjoelzodydlgpzoifa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

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

const targets = [
  { name: 'Candra', phone: '081291433257' },
  { name: 'Ivo',    phone: '08129472222'  },
]

const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 200 })

for (const t of targets) {
  const email = `${normalise(t.phone)}@aksarabuana.id`
  process.stdout.write(`${t.name} (${email})... `)

  const existing = allUsers.find(u => u.email === email)
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD })
    if (error) console.log(`ERROR updating password: ${error.message}`)
    else console.log('password reset ✓')
  } else {
    // Create new user (Ivo might be missing)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    })
    if (error) { console.log(`ERROR creating: ${error.message}`); continue }
    await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: t.name,
      role: 'admin',
      phone: normalise(t.phone),
      vehicle_type: null,
      active: true,
    }, { onConflict: 'id' })
    console.log('created ✓')
  }
}

console.log('\nDone. Both can log in with password: KurirAB!')
