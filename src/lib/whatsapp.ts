// WhatsApp Cloud API (Meta) — zero ban risk, official
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '62')
}

async function sendTemplate(phone: string, templateName: string, params: string[]): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN
  if (!token || !process.env.WHATSAPP_PHONE_NUMBER_ID) return false

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalisePhone(phone),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'id' },
          components: params.length ? [{
            type: 'body',
            parameters: params.map(text => ({ type: 'text', text })),
          }] : [],
        },
      }),
    })
    const json = await res.json()
    return !!json.messages?.[0]?.id
  } catch {
    return false
  }
}

// Template: aksara_driver_assigned
// Body: "Halo! Anda mendapat tugas pengantaran baru ke *{{1}}*. Buka aplikasi Aksara Buana untuk melihat detail."
export function notifyDriverAssigned(phone: string, destination: string) {
  return sendTemplate(phone, 'aksara_driver_assigned', [destination])
}

// Template: aksara_admin_delivered
// Body: "Update pengantaran: *{{1}}* telah diserahkan ke penerima. Buka aplikasi untuk konfirmasi."
export function notifyAdminDelivered(phone: string, stopLabel: string) {
  return sendTemplate(phone, 'aksara_admin_delivered', [stopLabel])
}
