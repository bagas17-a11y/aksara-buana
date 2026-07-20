'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TripStatus } from '@/types'
import AddStopDialog from './AddStopDialog'

export default function TripStatusActions({ trip }: { trip: { id: string; status: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [addStopOpen, setAddStopOpen] = useState(false)

  async function updateStatus(status: TripStatus) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('trips').update({ status }).eq('id', trip.id)
    setLoading(false)
    if (error) { toast.error(t.errorGeneric); return }
    toast.success('Status diperbarui.')
    router.refresh()
  }

  const status = trip.status as TripStatus

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {status === 'assigned' && (
          <Button variant="destructive" size="sm" onClick={() => updateStatus('cancelled')} disabled={loading}>
            {t.cancelTrip}
          </Button>
        )}
        {status === 'delivered' && (
          <Button size="sm" onClick={() => updateStatus('completed')} disabled={loading}>
            Tandai Selesai
          </Button>
        )}
        {status !== 'completed' && status !== 'cancelled' && (
          <Button variant="outline" size="sm" onClick={() => setAddStopOpen(true)} disabled={loading}>
            {t.addStop}
          </Button>
        )}
      </div>

      <AddStopDialog
        open={addStopOpen}
        onOpenChange={(open) => {
          setAddStopOpen(open)
          if (!open) router.refresh()
        }}
        tripId={trip.id}
      />
    </>
  )
}
