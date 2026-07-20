'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'

export default function PushSubscriber() {
  usePushSubscription()
  return null
}
