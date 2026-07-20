'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { MapPin, Truck, Users, Clock, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: t.navDashboard, icon: LayoutDashboard },
  { href: '/admin/map',       label: t.navLiveMap,   icon: MapPin },
  { href: '/admin/trips',     label: t.navTrips,     icon: Truck },
  { href: '/admin/drivers',   label: t.navDrivers,   icon: Users },
  { href: '/admin/history',   label: t.navHistory,   icon: Clock },
]

export default function AdminNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center h-14 gap-6">
        <span className="font-bold text-sm text-primary shrink-0">{t.appShortName}</span>
        <div className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">{profile.full_name}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t.logout}</span>
        </Button>
      </div>
    </nav>
  )
}
