'use client'

import { useEffect, useState } from 'react'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-lg mx-auto">
      <Download className="h-5 w-5 shrink-0" />
      <p className="text-sm flex-1">{t.installPrompt}</p>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={() => setDismissed(true)}>{t.installDismiss}</Button>
        <Button size="sm" onClick={handleInstall} className="bg-white text-primary hover:bg-white/90">{t.installAction}</Button>
      </div>
    </div>
  )
}
