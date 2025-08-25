'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe'

interface UserTypeToggleProps {
  userType: 'FREE' | 'PAID' | 'MENTOR'
  userId: string
}

export default function UserTypeToggle({ userType, userId }: UserTypeToggleProps) {
  const [currentType, setCurrentType] = useState<'FREE' | 'PAID'>(userType === 'MENTOR' ? 'PAID' : userType)
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const handleUpgrade = () => {
    setShowPaymentModal(true)
  }

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
      handleUpgrade()
    } else {
      await handleDowngrade()
    }
  }

  const handlePayment = async (cardNumber: string, expiryDate: string, cvc: string, name: string) => {
    setPaymentLoading(true)
    try {
      // Create subscription
      const response = await axios.post('/api/subscription/create')

      if (response.data.success) {
        setCurrentType('PAID')
        setShowPaymentModal(false)
        toast({ description: 'Payment successful! Welcome to the paid plan.' })
      } else {
        throw new Error(response.data.error || 'Payment failed')
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
              {currentType === 'PAID' ? 'Cancel Subscription' : 'Upgrade to Paid'}
            </Button>
            <span className={`font-medium ${currentType === 'PAID' ? 'text-yellow-500' : 'text-zinc-400'}`}>Paid</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className='text-xs text-zinc-500'>
            {currentType === 'PAID' 
              ? 'You have access to all paid features. $9.99/month.' 
              : 'Upgrade to paid to unlock premium features. $9.99/month.'
            }
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Paid Plan</DialogTitle>
          </DialogHeader>
          <PaymentForm 
            onSuccess={handlePayment}
            onCancel={() => setShowPaymentModal(false)}
            loading={paymentLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// Payment Form Component
interface PaymentFormProps {
  onSuccess: (cardNumber: string, expiryDate: string, cvc: string, name: string) => void
  onCancel: () => void
  loading: boolean
}

function PaymentForm({ onSuccess, onCancel, loading }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess(cardNumber, expiryDate, cvc, name)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Cardholder Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="cardNumber" className="text-sm font-medium">Card Number</label>
        <input
          id="cardNumber"
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</label>
          <input
            id="expiryDate"
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="cvc" className="text-sm font-medium">CVC</label>
          <input
            id="cvc"
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="pt-4 space-y-2">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay $9.99/month'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
} 