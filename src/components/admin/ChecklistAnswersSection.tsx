import Image from 'next/image'
import { CheckCircle, XCircle } from 'lucide-react'

interface Field {
  id: string
  label: string
  type: string
}

interface Props {
  title: string
  fields: Field[]
  answers: Record<string, unknown>
  submittedAt: string
  photoUrl?: string | null
  photoLabel?: string
}

export default function ChecklistAnswersSection({ title, fields, answers, submittedAt, photoUrl, photoLabel }: Props) {
  const time = new Date(submittedAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Dikirim: {time} WIB</p>

      <div className="divide-y rounded-lg border overflow-hidden text-sm">
        {fields.map(field => {
          const val = answers[field.id]
          const isYes = val === true || val === 'true' || val === 'ya' || val === 'yes'
          const isNo  = val === false || val === 'false' || val === 'tidak' || val === 'no'
          return (
            <div key={field.id} className="flex items-center justify-between px-3 py-2 bg-background">
              <span className="text-muted-foreground">{field.label}</span>
              {isYes && <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Ya</span>}
              {isNo  && <span className="flex items-center gap-1 text-red-500 font-medium"><XCircle className="h-4 w-4" /> Tidak</span>}
              {!isYes && !isNo && val !== undefined && val !== null && (
                <span className="font-medium">{String(val)}</span>
              )}
              {(val === undefined || val === null) && (
                <span className="text-muted-foreground italic text-xs">—</span>
              )}
            </div>
          )
        })}
      </div>

      {photoUrl && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{photoLabel ?? 'Foto Tanda Penerima'}</p>
          <a href={photoUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={photoUrl}
              alt={photoLabel ?? 'Foto Tanda Penerima'}
              className="rounded-lg border max-h-64 object-contain w-full bg-gray-50 cursor-zoom-in"
            />
            <p className="text-xs text-muted-foreground mt-1">Klik untuk buka ukuran penuh</p>
          </a>
        </div>
      )}
    </div>
  )
}
