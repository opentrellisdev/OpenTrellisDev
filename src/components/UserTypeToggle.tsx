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

  const handleToggle = async () => {
    const newType = currentType === 'FREE' ? 'PAID' : 'FREE'
    setLoading(true)
    try {
      await axios.patch('/api/username', { userType: newType })
      setCurrentType(newType)
      toast({ description: `Account type changed to ${newType === 'PAID' ? 'Paid' : 'Free'}.` })
    } catch (e) {
      toast({ description: 'Failed to update account type.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
              isLoading={loading}
              className='px-6'
              onClick={handleToggle}
            >
              {currentType === 'PAID' ? 'Switch to Free' : 'Upgrade to Paid'}
            </Button>
            <span className={`font-medium ${currentType === 'PAID' ? 'text-yellow-500' : 'text-zinc-400'}`}>Paid</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className='text-xs text-zinc-500'>
            {/* Placeholder for feature gating */}
            {currentType === 'PAID' ? 'You have access to all paid features.' : 'Upgrade to paid to unlock premium features.'}
          </div>
        </CardFooter>
      </Card>
      {currentType === 'PAID' && (
        <div className='mt-8 bg-green-50 border border-green-200 rounded-lg p-4'>
          <h2 className='font-semibold text-lg mb-2'>Private Messages</h2>
          <div className='text-sm text-zinc-600'>
            {/* This will be replaced with the actual messages UI */}
            You have no private messages yet.
          </div>
        </div>
      )}
    </>
  )
} 