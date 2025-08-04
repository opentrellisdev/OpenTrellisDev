'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { GraduationCap, ArrowLeft, Lock, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from '@/hooks/use-toast'

// Helper function to count characters
const countCharacters = (text: string) => {
  return text.length
}

// Helper function to format revenue
const formatRevenue = (value: string) => {
  if (!value) return ''
  
  // Remove any non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '')
  
  // If it's a valid number, format it
  if (numericValue && !isNaN(parseFloat(numericValue))) {
    const number = parseFloat(numericValue)
    return `$${number.toFixed(2)}`
  }
  
  return value
}

export default function MentorApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(2)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    experience: '',
    motivation: '',
    revenue: '',
    businessExplanation: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Fetch attempts
      const attemptsResponse = await axios.get('/api/user/mentor-attempts')
      setRemainingAttempts(attemptsResponse.data.mentorApplicationsLeft)

      // Check for pending applications
      const pendingResponse = await axios.get('/api/user/mentor-status')
      setHasPendingApplication(pendingResponse.data.hasPendingApplication)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  if (!session) {
    router.push('/sign-in')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await axios.post('/api/mentors/apply', {
        name: formData.name,
        age: formData.age,
        experience: formData.experience,
        motivation: formData.motivation,
        revenue: formData.revenue,
        businessExplanation: formData.businessExplanation
      })

      toast({
        title: 'Application Submitted!',
        description: 'Your mentor application has been submitted successfully. We\'ll review it and get back to you soon.',
      })

      router.push('/')
    } catch (error: any) {
      const errorMessage = error.response?.data || 'Failed to submit application. Please try again.'
      if (error.response?.status === 400) {
        toast({
          title: 'No Attempts Left',
          description: 'You have no remaining mentor application attempts.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const canApply = remainingAttempts > 0 && !hasPendingApplication

  return (
    <div className='w-full max-w-4xl mx-auto px-4 py-8'>
      <div className='mb-6'>
        <Link href='/' className='inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4'>
          <ArrowLeft className='h-4 w-4' />
          Back to Home
        </Link>
        <div className='flex items-center gap-3 mb-2'>
          <div className='bg-blue-100 p-2 rounded-lg'>
            <GraduationCap className='h-6 w-6 text-blue-600' />
          </div>
          <h1 className='text-3xl font-bold'>Apply to be a Mentor</h1>
        </div>
        <p className='text-zinc-600'>Share your experience and help others grow in their journey.</p>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg p-8'>
        {/* Application Status Display */}
        <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-gray-700'>Application Status:</span>
              {hasPendingApplication ? (
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-yellow-500' />
                  <span className='text-sm text-yellow-600 font-medium'>Pending Review</span>
                </div>
              ) : (
                <div className='flex items-center gap-1'>
                  {[1, 2].map((attempt) => (
                    <div
                      key={attempt}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        attempt <= remainingAttempts
                          ? 'bg-blue-400 text-white'
                          : 'bg-gray-300 text-gray-500'
                      }`}
                    >
                      {attempt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='text-sm text-gray-600'>
              {hasPendingApplication 
                ? 'Your application is under review'
                : `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`
              }
            </div>
          </div>
          {hasPendingApplication && (
            <div className='mt-2 flex items-center gap-2 text-sm text-yellow-600'>
              <AlertCircle className='h-4 w-4' />
              <span>You have a pending application. Please wait for admin review.</span>
            </div>
          )}
        </div>

        {canApply ? (
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='name'>Full Name</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Enter your full name'
                  required
                />
              </div>
              <div>
                <Label htmlFor='age'>Age</Label>
                <Input
                  id='age'
                  type='number'
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder='Enter your age'
                  min='18'
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='experience'>
                Relevant Experience
                <span className='text-red-500 ml-1'>*</span>
                <span className='text-sm text-zinc-500 ml-2'>
                  ({countCharacters(formData.experience)}/500 characters)
                </span>
              </Label>
              <Textarea
                id='experience'
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder='Describe your relevant experience, skills, and expertise... (500 characters or less)'
                rows={4}
                required
                className={countCharacters(formData.experience) > 500 ? 'border-red-300' : ''}
              />
              {countCharacters(formData.experience) > 500 && (
                <p className='text-red-500 text-sm mt-1'>Please keep your response to 500 characters or less</p>
              )}
            </div>

            <div>
              <Label htmlFor='motivation'>
                Why do you want to be a mentor?
                <span className='text-red-500 ml-1'>*</span>
                <span className='text-sm text-zinc-500 ml-2'>
                  ({countCharacters(formData.motivation)}/500 characters)
                </span>
              </Label>
              <Textarea
                id='motivation'
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder='Tell us about your motivation to help others and what you hope to achieve as a mentor... (500 characters or less)'
                rows={4}
                required
                className={countCharacters(formData.motivation) > 500 ? 'border-red-300' : ''}
              />
              {countCharacters(formData.motivation) > 500 && (
                <p className='text-red-500 text-sm mt-1'>Please keep your response to 500 characters or less</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='revenue'>
                  What was the highest revenue level for which you are responsible?
                  <span className='text-red-500 ml-1'>*</span>
                </Label>
                <Input
                  id='revenue'
                  value={formData.revenue}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^\d.]/g, '')
                    setFormData({ ...formData, revenue: value })
                  }}
                  onBlur={(e) => setFormData({ ...formData, revenue: formatRevenue(e.target.value) })}
                  placeholder='Enter amount (e.g., 50000)'
                  type='text'
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='businessExplanation'>
                Briefly explain the business context
                <span className='text-red-500 ml-1'>*</span>
                <span className='text-sm text-zinc-500 ml-2'>
                  ({countCharacters(formData.businessExplanation)}/500 characters)
                </span>
              </Label>
              <Textarea
                id='businessExplanation'
                value={formData.businessExplanation}
                onChange={(e) => setFormData({ ...formData, businessExplanation: e.target.value })}
                placeholder='Briefly explain the business or industry context for the revenue mentioned above... (500 characters or less)'
                rows={3}
                required
                className={countCharacters(formData.businessExplanation) > 500 ? 'border-red-300' : ''}
              />
              {countCharacters(formData.businessExplanation) > 500 && (
                <p className='text-red-500 text-sm mt-1'>Please keep your response to 500 characters or less</p>
              )}
            </div>

            <div className='flex gap-4 pt-4'>
              <Button
                type='submit'
                disabled={isSubmitting || 
                  countCharacters(formData.experience) < 10 || 
                  countCharacters(formData.motivation) < 10 || 
                  countCharacters(formData.businessExplanation) < 10 ||
                  countCharacters(formData.experience) > 500 || 
                  countCharacters(formData.motivation) > 500 ||
                  countCharacters(formData.businessExplanation) > 500 ||
                  !formData.revenue.trim()}
                className='bg-blue-600 hover:bg-blue-700 text-white'
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Link href='/'>
                <Button variant='outline' type='button'>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        ) : (
          <div className='text-center py-8'>
            {hasPendingApplication ? (
              <>
                <Clock className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>Application Pending</h3>
                <p className='text-gray-600 mb-4'>
                  Your mentor application is currently under review. Please wait for admin approval or rejection.
                </p>
              </>
            ) : (
              <>
                <Lock className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No Application Attempts Left</h3>
                <p className='text-gray-600 mb-4'>
                  You have used all your mentor application attempts.
                  Contact support if you believe this is an error.
                </p>
              </>
            )}
            <Link href='/'>
              <Button variant='outline'>
                Return to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 