'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'

interface UserTypeToggleProps {
  userType: 'FREE' | 'PAID' | 'MENTOR'
  userId: string
}

export default function UserTypeToggle({ userType, userId }: UserTypeToggleProps) {
  const [currentType, setCurrentType] = useState<'FREE' | 'PAID'>(userType === 'MENTOR' ? 'PAID' : userType)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const handleDowngrade = async () => {
    setLoading(true)
    try {
      await axios.post('/api/subscription/cancel')
      setCurrentType('FREE')
      toast({ description: 'Successfully cancelled subscription.' })
    } catch (e) {
      console.error('Downgrade error:', e)
      toast({ description: 'Failed to cancel subscription. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    if (currentType === 'FREE') {
      await handleUpgrade()
    } else {
      await handleDowngrade()
    }
  }

  const handleUpgrade = async () => {
    setPaymentLoading(true)
    try {
      // Create Stripe Checkout session
      const response = await axios.post('/api/subscription/create')

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url
      } else {
        throw new Error(response.data.error || 'Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast({ 
        description: error.message || 'Payment failed. Please try again.', 
        variant: 'destructive' 
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-4'>
          <span className={`font-medium ${currentType === 'FREE' ? 'text-green-600' : 'text-zinc-400'}`}>Free</span>
          <Button
            type='button'
            variant={currentType === 'PAID' ? 'default' : 'outline'}
            isLoading={loading || paymentLoading}
            className='px-6'
            onClick={handleToggle}
          >
            {currentType === 'PAID' ? 'Cancel Subscription' : 'Upgrade to Paid'}
          </Button>
          <span className={`font-medium ${currentType === 'PAID' ? 'text-yellow-500' : 'text-zinc-400'}`}>Paid</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className='text-xs text-zinc-500'>
          {currentType === 'PAID' 
            ? 'You have access to all paid features. $20/month.' 
            : 'Upgrade to paid to unlock premium features. $20/month.'
          }
        </div>
      </CardFooter>
    </Card>
  )
} 