'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Stop { label: string; address: string }

interface Props {
  driverId: string
  driverName: string
}

export default function DriverCreateTripForm({ driverId, driverName }: Props) {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [cargodesc, setCargoDesc] = useState('')
  const [notes, setNotes] = useState('')
  const [stops, setStops] = useState<Stop[]>([{ label: '', address: '' }])
  const [saving, setSaving] = useState(false)

  function addStop() { setStops(s => [...s, { label: '', address: '' }]) }
  function removeStop(i: number) { setStops(s => s.filter((_, idx) => idx !== i)) }
  function updateStop(i: number, field: keyof Stop, value: string) {
    setStops(s => s.map((stop, idx) => idx === i ? { ...stop, [field]: value } : stop))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) { toast.error('Nama pelanggan wajib diisi.'); return }
    if (stops.some(s => !s.label || !s.address)) { toast.error('Lengkapi semua tujuan.'); return }

    setSaving(true)
    const supabase = createClient()

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        driver_id:     driverId,
        dispatcher_id: driverId,
        cargo_desc:    cargodesc || 'Cetakan',
        customer_name: customerName,
        customer_phone: customerPhone || null,
        scheduled_at:  new Date().toISOString(),
        notes:         notes || null,
        status:        'assigned',
      })
      .select()
      .single()

    if (error || !trip) { toast.error('Gagal membuat pengantaran.'); setSaving(false); return }

    const { error: stopsErr } = await supabase.from('trip_stops').insert(
      stops.map((s, i) => ({ trip_id: trip.id, sequence: i + 1, label: s.label, address: s.address, status: 'pending' }))
    )
    if (stopsErr) { toast.error('Gagal menyimpan tujuan.'); setSaving(false); return }

    toast.success('Pengantaran berhasil dibuat.')
    router.push(`/driver/trips/${trip.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label>Sopir</Label>
        <p className="text-sm font-medium py-1 text-muted-foreground">{driverName} (Anda sendiri)</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="cargo">Muatan / Jenis Barang</Label>
        <Input id="cargo" value={cargodesc} onChange={e => setCargoDesc(e.target.value)} placeholder="Contoh: Cetakan Brosur" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="customer">Nama Pelanggan <span className="text-destructive">*</span></Label>
        <Input id="customer" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Nama toko / perusahaan" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cphone">No. HP Pelanggan</Label>
        <Input id="cphone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="tel" placeholder="08xxxxxxxxxx" />
      </div>

      <div className="space-y-2">
        <Label>Tujuan <span className="text-destructive">*</span></Label>
        {stops.map((stop, i) => (
          <Card key={i}>
            <CardContent className="pt-3 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Tujuan {i + 1}</span>
                {stops.length > 1 && (
                  <button type="button" onClick={() => removeStop(i)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input placeholder="Nama toko / lokasi" value={stop.label} onChange={e => updateStop(i, 'label', e.target.value)} required />
              <Input placeholder="Alamat lengkap" value={stop.address} onChange={e => updateStop(i, 'address', e.target.value)} required />
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" className="w-full gap-2" onClick={addStop}>
          <Plus className="h-4 w-4" /> Tambah Tujuan
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instruksi khusus (opsional)" rows={2} />
      </div>

      <Button type="submit" className="w-full h-12 text-base" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Buat Pengantaran'}
      </Button>
    </form>
  )
}
