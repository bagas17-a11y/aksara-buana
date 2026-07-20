'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, ChecklistTemplate } from '@/types'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ChecklistField from './ChecklistField'
import { ChevronLeft } from 'lucide-react'

interface Props {
  template: ChecklistTemplate
  trip: Trip
  driverId: string
  onComplete: () => void
  onBack: () => void
}

export default function PreTripChecklist({ template, trip, driverId, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function getGeoLocation(): Promise<GeolocationPosition | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
    })
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const field of template.fields) {
      if (field.required) {
        const val = answers[field.id]
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = t.errorRequired
        }
        // For boolean fields, explicitly check (false is valid)
        if (field.type === 'boolean' && val === undefined) {
          newErrors[field.id] = t.errorRequired
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error('Lengkapi semua item yang wajib diisi.')
      return
    }

    // Block if critical fields fail
    const healthField = template.fields.find(f => f.id === 'healthy')
    if (healthField && answers['healthy'] === false) {
      toast.error('Sopir harus dalam kondisi sehat untuk memulai perjalanan.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const position = await getGeoLocation()

    const { error: subError } = await supabase.from('checklist_submissions').insert({
      trip_id:     trip.id,
      driver_id:   driverId,
      template_id: template.id,
      type:        'pre',
      answers,
      lat:         position?.coords.latitude ?? null,
      lng:         position?.coords.longitude ?? null,
    })

    if (subError) { toast.error(t.errorGeneric); setSubmitting(false); return }

    // Advance trip status
    const { error: tripError } = await supabase
      .from('trips')
      .update({ status: 'pre_check_done' })
      .eq('id', trip.id)

    if (tripError) { toast.error(t.errorGeneric); setSubmitting(false); return }

    toast.success('Cek pra-perjalanan berhasil dikirim!')
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t.preCheckTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.preCheckSubtitle}</p>
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

      <Button type="submit" className="w-full h-14 text-base" disabled={submitting}>
        {submitting ? t.submitting : t.preCheckSubmit}
      </Button>
    </form>
  )
}
