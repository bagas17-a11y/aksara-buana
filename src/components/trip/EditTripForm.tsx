'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/lib/i18n'

interface Stop { id?: string; sequence: number; label: string; address: string; status: string }
interface Driver { id: string; full_name: string; vehicle_plate: string | null; vehicle_type: string | null }

interface Props {
  trip: {
    id: string
    driver_id: string
    cargo_desc: string
    customer_name: string
    customer_phone: string | null
    notes: string | null
    status: string
  }
  stops: Stop[]
  drivers: Driver[]
}

export default function EditTripForm({ trip, stops: initialStops, drivers }: Props) {
  const router = useRouter()
  const [driverId, setDriverId] = useState(trip.driver_id)
  const [cargoDesc, setCargoDesc] = useState(trip.cargo_desc)
  const [customerName, setCustomerName] = useState(trip.customer_name)
  const [customerPhone, setCustomerPhone] = useState(trip.customer_phone ?? '')
  const [notes, setNotes] = useState(trip.notes ?? '')
  const [stops, setStops] = useState<Stop[]>(initialStops)
  const [saving, setSaving] = useState(false)

  function addStop() {
    setStops(s => [...s, { sequence: s.length + 1, label: '', address: '', status: 'pending' }])
  }
  function removeStop(i: number) { setStops(s => s.filter((_, idx) => idx !== i)) }
  function updateStop(i: number, field: 'label' | 'address', value: string) {
    setStops(s => s.map((stop, idx) => idx === i ? { ...stop, [field]: value } : stop))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) { toast.error('Nama pelanggan wajib diisi.'); return }
    if (stops.some(s => !s.label || !s.address)) { toast.error('Lengkapi semua tujuan.'); return }

    setSaving(true)
    const supabase = createClient()

    const { error: tripError } = await supabase.from('trips').update({
      driver_id: driverId,
      cargo_desc: cargoDesc,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      notes: notes || null,
    }).eq('id', trip.id)

    if (tripError) { toast.error(t.errorGeneric); setSaving(false); return }

    // Delete existing stops and reinsert (simplest for reordering)
    await supabase.from('trip_stops').delete().eq('trip_id', trip.id)
    const { error: stopsError } = await supabase.from('trip_stops').insert(
      stops.map((s, i) => ({
        trip_id: trip.id,
        sequence: i + 1,
        label: s.label,
        address: s.address,
        status: s.status ?? 'pending',
      }))
    )

    if (stopsError) { toast.error(t.errorGeneric); setSaving(false); return }

    toast.success('Pengantaran berhasil diperbarui.')
    router.push(`/admin/trips/${trip.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-1">
        <Label>Sopir</Label>
        <Select value={driverId} onValueChange={v => setDriverId(v ?? driverId)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['car', 'motorcycle', null].map(type => {
              const group = drivers.filter(d => d.vehicle_type === type)
              if (!group.length) return null
              const label = type === 'car' ? '🚗 Sopir Mobil' : type === 'motorcycle' ? '🏍️ Sopir Motor' : '👤 Lainnya'
              return (
                <SelectGroup key={String(type)}>
                  <SelectLabel>{label}</SelectLabel>
                  {group.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name} {d.vehicle_plate ? `— ${d.vehicle_plate}` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Muatan / Deskripsi</Label>
        <Input value={cargoDesc} onChange={e => setCargoDesc(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nama Pelanggan</Label>
          <Input value={customerName} onChange={e => setCustomerName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>No. HP Pelanggan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
          <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="tel" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tujuan Pengantaran</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStop} className="gap-1">
            <Plus className="h-3 w-3" /> Tambah Tujuan
          </Button>
        </div>
        {stops.map((stop, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
                <Input
                  placeholder="Label (Contoh: Toko A)"
                  value={stop.label}
                  onChange={e => updateStop(i, 'label', e.target.value)}
                  required
                  className="flex-1"
                />
                {stops.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStop(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="pl-7">
                <Input
                  placeholder="Alamat lengkap"
                  value={stop.address}
                  onChange={e => updateStop(i, 'address', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-1">
        <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>{t.cancel}</Button>
        <Button type="submit" disabled={saving}>{saving ? t.saving : t.save}</Button>
      </div>
    </form>
  )
}
