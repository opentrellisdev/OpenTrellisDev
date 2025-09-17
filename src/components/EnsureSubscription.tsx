'use client'

import { useEnsureSubscription } from '@/hooks/use-ensure-subscription'

export default function EnsureSubscription() {
  useEnsureSubscription()
  return null // This component renders nothing, just runs the hook
}
