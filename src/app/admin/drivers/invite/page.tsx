import InviteDriverForm from '@/components/drivers/InviteDriverForm'

export default function InviteDriverPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Undang Sopir Baru</h1>
      <p className="text-muted-foreground mb-6">
        Sopir akan menerima email dengan tautan untuk mengatur kata sandi. Setelah itu mereka bisa langsung masuk ke aplikasi.
      </p>
      <InviteDriverForm />
    </div>
  )
}
