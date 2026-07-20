'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  phone: string
  driverName: string
  stops: { label: string; address: string }[]
  scheduledAt: string
  cargoDesc: string
}

export default function WhatsAppReminder({ phone, driverName, stops, scheduledAt, cargoDesc }: Props) {
  function openWhatsApp() {
    const normalised = phone.replace(/\D/g, '').replace(/^0/, '62')
    const stopLines = stops.map((s, i) => `${i + 1}. ${s.label} — ${s.address}`).join('\n')
    const message = [
      `Halo ${driverName}, ini pengingat tugas pengantaran dari Aksara Buana:`,
      ``,
      `📦 Muatan: ${cargoDesc}`,
      `🕐 Jadwal: ${scheduledAt} WIB`,
      ``,
      `📍 Tujuan:`,
      stopLines,
      ``,
      `Mohon buka aplikasi untuk memulai perjalanan. Terima kasih!`,
    ].join('\n')

    window.open(`https://wa.me/${normalised}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={openWhatsApp} className="gap-2 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950">
      <MessageCircle className="h-4 w-4" />
      Ingatkan via WhatsApp
    </Button>
  )
}
