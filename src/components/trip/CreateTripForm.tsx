'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Stop { label: string; address: string }

interface Driver {
  id: string
  full_name: string
  vehicle_plate: string | null
  vehicle_type: string | null
  phone: string | null
}

interface Props {
  drivers: Driver[]
  dispatcherId: string
}

export default function CreateTripForm({ drivers, dispatcherId }: Props) {
  const router = useRouter()
  const [driverId, setDriverId] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const scheduledAt = new Date().toISOString()
  const [notes, setNotes] = useState('')
  const [stops, setStops] = useState<Stop[]>([{ label: '', address: '' }])
  const [saving, setSaving] = useState(false)

  // SPK fields
  const [jenisCetakan, setJenisCetakan] = useState('')
  const [judulCetakan, setJudulCetakan] = useState('')
  const [spesifikasi, setSpesifikasi] = useState('')
  const [quantity, setQuantity] = useState('')
  const [jumlahDus, setJumlahDus] = useState('')
  const [catatanKualitas, setCatatanKualitas] = useState('')
  const [perluVideoHandover, setPerluVideoHandover] = useState(false)

  function addStop() { setStops(s => [...s, { label: '', address: '' }]) }
  function removeStop(i: number) { setStops(s => s.filter((_, idx) => idx !== i)) }
  function updateStop(i: number, field: keyof Stop, value: string) {
    setStops(s => s.map((stop, idx) => idx === i ? { ...stop, [field]: value } : stop))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!driverId) { toast.error('Pilih sopir terlebih dahulu.'); return }
    if (!customerName.trim()) { toast.error('Nama pelanggan wajib diisi.'); return }
    if (stops.some(s => !s.label || !s.address)) { toast.error('Lengkapi semua tujuan.'); return }

    setSaving(true)
    const supabase = createClient()

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        driver_id: driverId,
        dispatcher_id: dispatcherId,
        cargo_desc: [jenisCetakan, judulCetakan].filter(Boolean).join(' — ') || 'Cetakan',
        customer_name: customerName,
        customer_phone: customerPhone || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        notes: notes || null,
        status: 'assigned',
        jenis_cetakan: jenisCetakan || null,
        judul_cetakan: judulCetakan || null,
        spesifikasi: spesifikasi || null,
        quantity: quantity ? parseInt(quantity) : null,
        jumlah_dus: jumlahDus ? parseInt(jumlahDus) : null,
        catatan_kualitas: catatanKualitas || null,
        perlu_video_handover: perluVideoHandover,
      })
      .select()
      .single()

    if (error || !trip) {
      toast.error(t.errorGeneric)
      setSaving(false)
      return
    }

    const stopRows = stops.map((s, i) => ({
      trip_id: trip.id,
      sequence: i + 1,
      label: s.label,
      address: s.address,
      status: 'pending',
    }))

    const { error: stopsError } = await supabase.from('trip_stops').insert(stopRows)
    if (stopsError) { toast.error(t.errorGeneric); setSaving(false); return }

    toast.success('Pengantaran berhasil dibuat.')

    // Open WhatsApp reminder if driver has a phone number
    if (selectedDriver?.phone) {
      const phone = selectedDriver.phone.replace(/\D/g, '').replace(/^0/, '62')
      const stopLines = stops.map((s, i) => `${i + 1}. ${s.label} — ${s.address}`).join('\n')
      const scheduledLabel = new Date(scheduledAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      const message = [
        `Halo ${selectedDriver.full_name}, ada tugas pengantaran baru dari Aksara Buana:`,
        ``,
        `Muatan: ${[jenisCetakan, judulCetakan].filter(Boolean).join(' — ') || 'Cetakan'}`,
        `Waktu: ${scheduledLabel} WIB`,
        ``,
        `Tujuan:`,
        stopLines,
        ``,
        `Mohon buka aplikasi di abkurir.com untuk memulai perjalanan. Terima kasih!`,
      ].join('\n')
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    router.push(`/admin/trips/${trip.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label>{t.assignDriver}</Label>
        <Select value={driverId} onValueChange={v => { setDriverId(v ?? ''); setSelectedDriver(drivers.find(d => d.id === v) ?? null) }} required>
          <SelectTrigger>
            <SelectValue placeholder="Pilih sopir..." />
          </SelectTrigger>
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

      {/* SPK Section */}
      <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
        <p className="text-sm font-semibold text-foreground">{t.spkSection}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>{t.jenisCetakan} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
            <Input
              value={jenisCetakan}
              onChange={e => {
                setJenisCetakan(e.target.value)
                // auto-flag video handover for roll/standing banners
                const v = e.target.value.toLowerCase()
                if (v.includes('roll') || v.includes('standing')) setPerluVideoHandover(true)
                else setPerluVideoHandover(false)
              }}
              placeholder={t.jenisCetakanPlaceholder}
            />
          </div>
          <div className="space-y-1">
            <Label>{t.judulCetakan} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
            <Input value={judulCetakan} onChange={e => setJudulCetakan(e.target.value)} placeholder={t.judulCetakanPlaceholder} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>{t.spesifikasi} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
          <Input value={spesifikasi} onChange={e => setSpesifikasi(e.target.value)} placeholder={t.spesifikasiPlaceholder} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>{t.quantity} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
            <Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" placeholder="Contoh: 5" />
          </div>
          <div className="space-y-1">
            <Label>{t.jumlahDus} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
            <Input value={jumlahDus} onChange={e => setJumlahDus(e.target.value)} type="number" min="1" placeholder="Contoh: 2" />
          </div>
        </div>

        <div className="space-y-1">
          <Label>{t.catatanKualitas} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
          <Textarea value={catatanKualitas} onChange={e => setCatatanKualitas(e.target.value)} rows={2} placeholder={t.catatanKualitasPlaceholder} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={perluVideoHandover}
            onChange={e => setPerluVideoHandover(e.target.checked)}
            className="mt-0.5 accent-primary h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-medium">{t.perluVideoHandover}</span>
            <span className="block text-muted-foreground text-xs mt-0.5">{t.perluVideoHandoverHint}</span>
          </span>
        </label>
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

      {/* Stops */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tujuan Pengantaran</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStop} className="gap-1">
            <Plus className="h-3 w-3" /> {t.addStop}
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStop(i)} className="shrink-0">
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
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t.saving : t.createTrip}
        </Button>
      </div>
    </form>
  )
}
