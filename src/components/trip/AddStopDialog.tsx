'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

export default function AddStopDialog({ open, onOpenChange, tripId }: Props) {
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()

    const { data: existingStops } = await supabase
      .from('trip_stops')
      .select('sequence')
      .eq('trip_id', tripId)
      .order('sequence', { ascending: false })
      .limit(1)

    const nextSequence = (existingStops?.[0]?.sequence ?? 0) + 1

    const { error } = await supabase.from('trip_stops').insert({
      trip_id: tripId,
      sequence: nextSequence,
      label,
      address,
      status: 'pending',
    })

    setSaving(false)

    if (error) {
      toast.error(t.errorGeneric)
    } else {
      toast.success('Tujuan baru berhasil ditambahkan.')
      setLabel('')
      setAddress('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.addFollowUp}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="stop-label">Label Tujuan</Label>
            <Input
              id="stop-label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Contoh: Toko B, Gudang C"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="stop-address">Alamat</Label>
            <Input
              id="stop-address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Alamat lengkap tujuan"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t.saving : t.addStop}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
