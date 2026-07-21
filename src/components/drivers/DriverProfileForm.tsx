'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Profile } from '@/types'

export default function DriverProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [vehiclePlate, setVehiclePlate] = useState(profile.vehicle_plate ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vehiclePlate.trim()) { toast.error('Plat nomor wajib diisi.'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ vehicle_plate: vehiclePlate.trim().toUpperCase() })
      .eq('id', profile.id)
    if (error) { toast.error('Gagal menyimpan. Coba lagi.'); setSaving(false); return }
    toast.success('Plat kendaraan berhasil disimpan.')
    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
      <div className="space-y-1">
        <Label>Nama</Label>
        <p className="text-sm font-medium py-2">{profile.full_name}</p>
      </div>
      <div className="space-y-1">
        <Label>No. HP</Label>
        <p className="text-sm font-medium py-2">{profile.phone ?? '—'}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="plate">Plat Kendaraan <span className="text-destructive">*</span></Label>
        <Input
          id="plate"
          value={vehiclePlate}
          onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
          placeholder="Contoh: B 1234 XYZ"
          className="uppercase"
          required
        />
        <p className="text-xs text-muted-foreground">Wajib diisi agar admin dapat mengidentifikasi kendaraan Anda.</p>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan Plat Kendaraan'}
      </Button>
    </form>
  )
}
