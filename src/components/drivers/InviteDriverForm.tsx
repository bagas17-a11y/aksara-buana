'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { t } from '@/lib/i18n'

export default function InviteDriverForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/admin/invite-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, phone, vehicle_plate: vehiclePlate }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? t.errorGeneric)
      setSaving(false)
      return
    }

    toast.success(`Undangan dikirim ke ${email}. Sopir akan menerima email untuk mengatur kata sandi.`)
    router.push('/admin/drivers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1">
        <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
        <Input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          placeholder="Contoh: Abdul Rohman"
        />
      </div>

      <div className="space-y-1">
        <Label>Alamat Email <span className="text-destructive">*</span></Label>
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
          placeholder="sopir@email.com"
        />
        <p className="text-xs text-muted-foreground">
          Sopir akan menerima email undangan untuk mengatur kata sandi mereka.
        </p>
      </div>

      <div className="space-y-1">
        <Label>No. HP <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
        <Input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          type="tel"
          placeholder="Contoh: 08123456789"
        />
      </div>

      <div className="space-y-1">
        <Label>Plat Kendaraan <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
        <Input
          value={vehiclePlate}
          onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
          placeholder="Contoh: B 1234 XYZ"
          className="uppercase"
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Mengirim undangan...' : 'Kirim Undangan'}
        </Button>
      </div>
    </form>
  )
}
