'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, ChecklistTemplate, TripStop } from '@/types'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import ChecklistField from './ChecklistField'
import { ChevronLeft, Camera, PenLine, Upload } from 'lucide-react'

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
  const [podFile, setPodFile] = useState<File | null>(null)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signing, setSigning] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  function getGeoLocation(): Promise<GeolocationPosition | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
    })
  }

  // Canvas drawing helpers
  function getPointerPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const src = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    setSigning(true)
    lastPoint.current = getPointerPos(e, canvasRef.current!)
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    if (!signing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    const pos = getPointerPos(e, canvasRef.current)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPoint.current = pos
    setHasSignature(true)
  }

  function stopDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    setSigning(false)
    lastPoint.current = null
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: true })
    if (error) { toast.error(t.errorUpload); return null }
    return path
  }

  async function uploadSignature(tripId: string): Promise<string | null> {
    if (!hasSignature || !canvasRef.current) return null
    const supabase = createClient()
    return new Promise(resolve => {
      canvasRef.current!.toBlob(async blob => {
        if (!blob) { resolve(null); return }
        const path = `${tripId}/signature.png`
        const { error } = await supabase.storage.from('attachments').upload(path, blob, { contentType: 'image/png', upsert: true })
        resolve(error ? null : path)
      }, 'image/png')
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

    // Upload signature
    const sigPath = await uploadSignature(trip.id)

    // Upload POD photo
    let podPath: string | null = null
    if (podFile) {
      podPath = await uploadFile(podFile, `${trip.id}/pod-${Date.now()}.${podFile.name.split('.').pop()}`)
    }

    // Upload invoice
    let invoicePath: string | null = null
    if (invoiceFile) {
      invoicePath = await uploadFile(invoiceFile, `${trip.id}/invoice-${Date.now()}.${invoiceFile.name.split('.').pop()}`)
    }

    // Save checklist submission
    const { error: subError } = await supabase.from('checklist_submissions').insert({
      trip_id:     trip.id,
      driver_id:   driverId,
      template_id: template.id,
      type:        'post',
      answers:     { ...answers, signature_path: sigPath, pod_path: podPath, invoice_path: invoicePath },
      lat:         position?.coords.latitude ?? null,
      lng:         position?.coords.longitude ?? null,
    })
    if (subError) { toast.error(t.errorGeneric); setSubmitting(false); return }

    // Save attachments metadata
    type AttachmentInsert = { trip_id: string; stop_id: string | null; kind: string; storage_path: string }
    const attachmentInserts: AttachmentInsert[] = [
      sigPath     ? { trip_id: trip.id, stop_id: currentStop?.id ?? null, kind: 'signature', storage_path: sigPath } : null,
      podPath     ? { trip_id: trip.id, stop_id: currentStop?.id ?? null, kind: 'pod',       storage_path: podPath } : null,
      invoicePath ? { trip_id: trip.id, stop_id: currentStop?.id ?? null, kind: 'invoice',   storage_path: invoicePath } : null,
    ].filter((x): x is AttachmentInsert => x !== null)

    if (attachmentInserts.length > 0) {
      await supabase.from('attachments').insert(attachmentInserts)
    }

    // Mark current stop as delivered
    if (currentStop) {
      await supabase.from('trip_stops').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', currentStop.id)
    }

    // Check if all stops delivered → mark trip as delivered
    const { data: allStops } = await supabase.from('trip_stops').select('status').eq('trip_id', trip.id)
    const allDone = allStops?.every(s => s.status === 'delivered')
    if (allDone) {
      await supabase.from('trips').update({ status: 'delivered' }).eq('id', trip.id)
      await supabase.from('driver_locations').delete().eq('driver_id', driverId)
    }

    // Notify all admins via WhatsApp + push
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
          title: allDone ? 'Pengantaran Selesai ✓' : 'Update Pengantaran',
          body: `${currentStop?.label ?? 'Tujuan'} telah diserahkan ke penerima.`,
          url: `/admin/trips/${trip.id}`,
        }),
      }).catch(() => {})
    }

    toast.success('Cek pasca-pengantaran berhasil dikirim!')
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t.postCheckTitle}</h1>
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

      {/* Signature capture */}
      <div className="space-y-2">
        <Label className="text-base font-medium">{t.fieldSignature}</Label>
        <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={340}
            height={160}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <PenLine className="h-3 w-3" /> Tanda tangan di area di atas
          </p>
          {hasSignature && (
            <button type="button" onClick={clearSignature} className="text-xs text-destructive">
              {t.fieldSignatureClear}
            </button>
          )}
        </div>
      </div>

      {/* POD Photo */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" /> {t.fieldPodPhoto}
        </Label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => setPodFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground cursor-pointer"
        />
        {podFile && <p className="text-xs text-green-600">✓ {podFile.name}</p>}
      </div>

      {/* Invoice upload */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Upload className="h-4 w-4" /> {t.fieldInvoiceUpload}
        </Label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={e => setInvoiceFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground cursor-pointer"
        />
        {invoiceFile && <p className="text-xs text-green-600">✓ {invoiceFile.name}</p>}
      </div>

      <Button type="submit" className="w-full h-14 text-base" disabled={submitting}>
        {submitting ? t.submitting : t.postCheckSubmit}
      </Button>
    </form>
  )
}
