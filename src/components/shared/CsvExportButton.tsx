'use client'

import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface TripRow {
  id: string
  scheduled_at: string
  status: string
  cargo_desc: string
  customer_name: string
  customer_phone: string | null
  driver?: { full_name: string } | unknown
  notes: string | null
}

export default function CsvExportButton({ trips }: { trips: TripRow[] }) {
  function exportCsv() {
    const headers = ['ID', 'Tanggal', 'Status', 'Sopir', 'Muatan', 'Pelanggan', 'No HP', 'Catatan']
    const rows = trips.map(tr => [
      tr.id.slice(0, 8),
      new Date(tr.scheduled_at).toLocaleString('id-ID'),
      tr.status,
      (tr.driver as {full_name:string})?.full_name ?? '',
      tr.cargo_desc,
      tr.customer_name,
      tr.customer_phone ?? '',
      tr.notes ?? '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `aksara-buana-trips-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={exportCsv} className="gap-2">
      <Download className="h-4 w-4" />
      {t.exportCsv}
    </Button>
  )
}
