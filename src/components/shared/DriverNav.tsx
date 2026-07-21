'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Home, Truck, MapPin, UserCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/driver/dashboard', label: 'Beranda',    icon: Home },
  { href: '/driver/trips',     label: 'Perjalanan', icon: Truck },
  { href: '/driver/map',       label: 'Peta',       icon: MapPin },
  { href: '/driver/profile',   label: 'Profil',     icon: UserCircle },
]

export default function DriverNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 py-3 px-6 text-xs font-medium transition-colors',
              pathname.startsWith(href)
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-3 px-6 text-xs font-medium text-muted-foreground"
        >
          <LogOut className="h-6 w-6" />
          {t.logout}
        </button>
      </div>
    </nav>
  )
}
