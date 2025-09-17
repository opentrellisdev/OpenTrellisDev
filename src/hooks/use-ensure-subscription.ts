'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import axios from 'axios'

export function useEnsureSubscription() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Call the API to ensure subscription
      const ensureSubscription = async () => {
        try {
          console.log('Ensuring subscription for authenticated user')
          const response = await axios.post('/api/user/ensure-subscription')
          console.log('Subscription check result:', response.data)
        } catch (error) {
          console.error('Error ensuring subscription:', error)
        }
      }

      ensureSubscription()
    }
  }, [session, status])
}
