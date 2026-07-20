import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notifyDriverAssigned, notifyAdminDelivered } from '@/lib/whatsapp'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

// event = 'driver_assigned' | 'admin_delivered'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_ids, event, param, title, body, url } = await req.json()
  if (!user_ids?.length) return NextResponse.json({ error: 'Missing user_ids' }, { status: 400 })

  const admin = createAdminClient()

  const [{ data: profiles }, { data: pushSubs }] = await Promise.all([
    admin.from('profiles').select('id, phone').in('id', user_ids),
    admin.from('push_subscriptions').select('endpoint, p256dh, auth').in('user_id', user_ids),
  ])

  const results = { whatsapp: 0, push: 0 }

  // WhatsApp via approved templates
  if (profiles?.length) {
    await Promise.all(
      profiles.map(async (p) => {
        if (!p.phone) return
        let sent = false
        if (event === 'driver_assigned') sent = await notifyDriverAssigned(p.phone, param)
        if (event === 'admin_delivered')  sent = await notifyAdminDelivered(p.phone, param)
        if (sent) results.whatsapp++
      })
    )
  }

  // Web push as fallback (works without templates)
  if (pushSubs?.length) {
    const payload = JSON.stringify({ title, body, url: url ?? '/', tag: 'aksara-buana' })
    const pushResults = await Promise.allSettled(
      pushSubs.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
      )
    )
    results.push = pushResults.filter(r => r.status === 'fulfilled').length
  }

  return NextResponse.json(results)
}
