'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { t } from '@/lib/i18n'
import type { Profile, VehicleType } from '@/types'

interface Props { driver: Profile }

export default function EditDriverForm({ driver }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(driver.full_name)
  const [phone, setPhone] = useState(driver.phone ?? '')
  const [vehiclePlate, setVehiclePlate] = useState(driver.vehicle_plate ?? '')
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(driver.vehicle_type ?? '')
  const [active, setActive] = useState(driver.active)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        vehicle_plate: vehiclePlate || null,
        vehicle_type: vehicleType || null,
        active,
      })
      .eq('id', driver.id)

    if (error) {
      toast.error(t.errorGeneric)
      setSaving(false)
      return
    }

    toast.success('Data sopir berhasil diperbarui.')
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
        />
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

      {driver.role === 'driver' && (
        <div className="space-y-1">
          <Label>Jenis Kendaraan <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
          <Select value={vehicleType} onValueChange={v => setVehicleType(v as VehicleType)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis kendaraan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Mobil</SelectItem>
              <SelectItem value="motorcycle">Motor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label>Plat Kendaraan <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
        <Input
          value={vehiclePlate}
          onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
          placeholder="Contoh: B 1234 XYZ"
          className="uppercase"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          className="accent-primary h-4 w-4"
        />
        <span className="text-sm font-medium">Sopir aktif di sistem</span>
      </label>
      <p className="text-xs text-muted-foreground -mt-3">
        Sopir yang dinonaktifkan tidak akan muncul di daftar pilihan saat membuat pengantaran.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t.saving : t.save}
        </Button>
      </div>
    </form>
  )
}
