import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Pencil, Phone, Car, Bike } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DriversPage() {
  const supabase = await createClient()
  const { data: drivers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'driver')
    .order('full_name')

  const { data: locations } = await supabase
    .from('driver_locations')
    .select('driver_id, recorded_at')

  const activeDriverIds = new Set(
    (locations ?? [])
      .filter(l => Date.now() - new Date(l.recorded_at).getTime() < 5 * 60 * 1000)
      .map(l => l.driver_id)
  )

  const carDrivers = (drivers ?? []).filter(d => d.vehicle_type === 'car')
  const motoDrivers = (drivers ?? []).filter(d => d.vehicle_type === 'motorcycle')
  const otherDrivers = (drivers ?? []).filter(d => !d.vehicle_type)

  type DriverRow = NonNullable<typeof drivers>[number]
  function DriverCard({ driver }: { driver: DriverRow }) {
    const isOnline = activeDriverIds.has(driver.id)
    return (
      <Card className={!driver.active ? 'opacity-60' : undefined}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{driver.full_name}</p>
              {!driver.active && (
                <Badge variant="destructive" className="text-xs mt-1">Nonaktif</Badge>
              )}
            </div>
            <Badge variant={isOnline ? 'default' : 'secondary'} className="shrink-0">
              {isOnline ? '● Online' : 'Offline'}
            </Badge>
          </div>

          {driver.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{driver.phone}</span>
            </div>
          )}
          {driver.vehicle_plate && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Car className="h-3.5 w-3.5 shrink-0" />
              <span>{driver.vehicle_plate}</span>
            </div>
          )}

          <Link href={`/admin/drivers/${driver.id}/edit`} className="block">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit Data
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.navDrivers}</h1>
        <Link href="/admin/drivers/invite">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Sopir
          </Button>
        </Link>
      </div>

      {!drivers?.length && (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">Belum ada sopir terdaftar.</p>
        </div>
      )}

      {carDrivers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Sopir Mobil ({carDrivers.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carDrivers.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}

      {motoDrivers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Sopir Motor ({motoDrivers.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {motoDrivers.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}

      {otherDrivers.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Lainnya ({otherDrivers.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherDrivers.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}
    </div>
  )
}
