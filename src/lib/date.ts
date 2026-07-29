import { format } from 'date-fns'
import { tz } from '@date-fns/tz'
import { id as idLocale } from 'date-fns/locale'

const WIB = tz('Asia/Jakarta')

export function fmtDateTime(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy HH:mm', { locale: idLocale, in: WIB })
}

export function fmtDateTimeShort(iso: string) {
  return format(new Date(iso), 'dd MMM HH:mm', { locale: idLocale, in: WIB })
}

export function fmtDateTimeLong(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, HH:mm', { locale: idLocale, in: WIB })
}

export function fmtDateFull(iso: string) {
  return format(new Date(iso), 'EEEE, dd MMMM yyyy', { locale: idLocale, in: WIB })
}

export function fmtTime(iso: string) {
  return format(new Date(iso), 'HH:mm', { locale: idLocale, in: WIB })
}
