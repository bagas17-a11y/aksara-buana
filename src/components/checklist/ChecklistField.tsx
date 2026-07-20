'use client'

import { ChecklistTemplateField } from '@/types'
import { t } from '@/lib/i18n'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  field: ChecklistTemplateField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export default function ChecklistField({ field, value, onChange, error }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.type === 'boolean' && (
        <div className="flex gap-3">
          {[true, false].map(v => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange(v)}
              className={`flex-1 py-3 rounded-lg border-2 text-base font-medium transition-colors ${
                value === v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {v ? t.yes : t.no}
            </button>
          ))}
        </div>
      )}

      {field.type === 'select' && (
        <Select value={value as string ?? ''} onValueChange={onChange}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder={t.selectPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'number' && (
        <Input
          type="number"
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={field.placeholder}
          className="h-12 text-base"
        />
      )}

      {field.type === 'text' && (
        <Textarea
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={2}
          className="text-base"
        />
      )}

      {field.type === 'checkboxgroup' && (
        <div className="space-y-2">
          {field.options?.map(opt => {
            const checked = Array.isArray(value) && (value as string[]).includes(opt)
            return (
              <div key={opt} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id={`${field.id}-${opt}`}
                  checked={checked}
                  onCheckedChange={c => {
                    const current = Array.isArray(value) ? (value as string[]) : []
                    onChange(c ? [...current, opt] : current.filter(v => v !== opt))
                  }}
                  className="h-5 w-5"
                />
                <Label htmlFor={`${field.id}-${opt}`} className="text-base cursor-pointer">{opt}</Label>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
