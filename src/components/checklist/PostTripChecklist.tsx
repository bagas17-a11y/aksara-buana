'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, ChecklistTemplate, TripStop } from '@/types'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import ChecklistField from './ChecklistField'
import { ChevronLeft, Camera } from 'lucide-react'

interface Props {
  template: ChecklistTemplate
  trip: Trip
  driverId: string
  currentStop: TripStop | null
  onComplete: () => void
  onBack: () => void
}

export default function PostTripChecklist({ template, trip, driverId, currentStop, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tandaPenerimaFile, setTandaPenerimaFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function getGeoLocation(): Promise<GeolocationPosition | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
    })
  }

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: true })
    if (error) { toast.error(t.errorUpload); return null }
    return path
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const field of template.fields) {
      if (field.required) {
        const val = answers[field.id]
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = t.errorRequired
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) { toast.error('Lengkapi semua item yang wajib.'); return }

    setSubmitting(true)
    const supabase = createClient()
    const position = await getGeoLocation()

    // Upload tanda penerima photo
    let tandaPenerimaPath: string | null = null
    if (tandaPenerimaFile) {
      tandaPenerimaPath = await uploadFile(
        tandaPenerimaFile,
        `${trip.id}/tanda-penerima-${Date.now()}.${tandaPenerimaFile.name.split('.').pop()}`
      )
    }

    // Save checklist submission
    const { error: subError } = await supabase.from('checklist_submissions').insert({
      trip_id:     trip.id,
      driver_id:   driverId,
      template_id: template.id,
      type:        'post',
      answers:     { ...answers, tanda_penerima_path: tandaPenerimaPath },
      lat:         position?.coords.latitude ?? null,
      lng:         position?.coords.longitude ?? null,
    })
    if (subError) { toast.error(t.errorGeneric); setSubmitting(false); return }

    // Save attachment metadata
    if (tandaPenerimaPath) {
      await supabase.from('attachments').insert({
        trip_id: trip.id,
        stop_id: currentStop?.id ?? null,
        kind: 'pod',
        storage_path: tandaPenerimaPath,
      })
    }

    // Mark all pending stops as delivered
    await supabase
      .from('trip_stops')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('trip_id', trip.id)
      .neq('status', 'delivered')

    // Post-checklist is the final step — always mark trip delivered
    await supabase.from('trips').update({ status: 'delivered' }).eq('id', trip.id)
    await supabase.from('driver_locations').delete().eq('driver_id', driverId)

    // Notify all admins via push
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('active', true)
    if (adminProfiles?.length) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: adminProfiles.map(p => p.id),
          event: 'admin_delivered',
          param: currentStop?.label ?? 'Tujuan',
          title: allDone ? 'Pengantaran Selesai' : 'Update Pengantaran',
          body: `${currentStop?.label ?? 'Tujuan'} telah diserahkan ke penerima.`,
          url: `/admin/trips/${trip.id}`,
        }),
      }).catch(() => {})
    }

    toast.success('Cek pasca-pengiriman berhasil dikirim!')
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold">Checklist Setelah Pengiriman</h1>
          {currentStop && <p className="text-sm text-muted-foreground">Tujuan: {currentStop.label}</p>}
        </div>
      </div>

      {template.fields.map(field => (
        <ChecklistField
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={val => setAnswers(a => ({ ...a, [field.id]: val }))}
          error={errors[field.id]}
        />
      ))}

      {/* Tanda Penerima Photo */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" /> Foto Tanda Penerima
        </Label>
        <p className="text-xs text-muted-foreground">Upload foto tanda terima / bukti penerimaan dari klien.</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => setTandaPenerimaFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground cursor-pointer"
        />
        {tandaPenerimaFile && <p className="text-xs text-green-600">✓ {tandaPenerimaFile.name}</p>}
      </div>

      <Button type="submit" className="w-full h-14 text-base" disabled={submitting}>
        {submitting ? t.submitting : 'Kirim Laporan'}
      </Button>
    </form>
  )
}
