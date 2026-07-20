import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditDriverForm from '@/components/drivers/EditDriverForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditDriverPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: driver } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'driver')
    .single()

  if (!driver) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Edit Data Sopir</h1>
      <p className="text-muted-foreground mb-6">{driver.full_name}</p>
      <EditDriverForm driver={driver} />
    </div>
  )
}
