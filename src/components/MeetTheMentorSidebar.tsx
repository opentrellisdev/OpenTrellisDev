'use client'

import { useSession } from 'next-auth/react'
import { GraduationCap, ArrowRight, Lock, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MeetTheMentorSidebar() {
  const { data: session } = useSession()
  const [remainingAttempts, setRemainingAttempts] = useState(2)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)

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

  if (!session?.user) return null

  const isPaidUser = session.user.userType === 'PAID' || session.user.userType === 'MENTOR'
  const isMentor = session.user.userType === 'MENTOR'
  const canApply = remainingAttempts > 0 && !hasPendingApplication && !isMentor

  return (
    <div className='overflow-hidden h-fit rounded-lg border border-gray-200 mb-4'>
      <div className='bg-blue-100 px-6 py-4'>
        <p className='font-semibold py-3 flex items-center gap-1.5'>
          <GraduationCap className='h-4 w-4' />
          Meet the Mentor
        </p>
      </div>
      <dl className='-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6'>
        <div className='flex justify-between gap-x-4 py-3'>
          <p className='text-zinc-500'>
            Connect with experienced mentors and get guidance for your journey.
          </p>
        </div>
        <div className='space-y-2 mt-4'>
          <Link
            href={isPaidUser ? '/mentors' : '#'}
            className={`w-full block text-center py-2 px-4 rounded-lg font-medium transition-all duration-200 group relative overflow-hidden ${
              isPaidUser
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={(e) => !isPaidUser && e.preventDefault()}
          >
            <span className='flex items-center justify-center gap-2'>
              Visit Mentors
              {!isPaidUser && <Lock className='h-4 w-4' />}
              {isPaidUser && <ArrowRight className='h-4 w-4 transition-all duration-200 group-hover:translate-x-2 group-hover:w-5' />}
            </span>
          </Link>
          <Link
            href={canApply ? '/mentors/apply' : '#'}
            className={`w-full block text-center py-2 px-4 rounded-lg font-medium transition-all duration-200 group relative overflow-hidden ${
              canApply
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={(e) => !canApply && e.preventDefault()}
          >
            <span className='flex items-center justify-center gap-2'>
              {hasPendingApplication ? 'Application Pending' : 'Apply to be a Mentor'}
              {hasPendingApplication ? (
                <Clock className='h-4 w-4' />
              ) : (
                <div className='flex items-center gap-1'>
                  {[1, 2].map((attempt) => (
                    <div
                      key={attempt}
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
                        attempt <= remainingAttempts
                          ? 'bg-blue-400 text-white'
                          : 'bg-gray-400 text-gray-600'
                      }`}
                    >
                      {attempt}
                    </div>
                  ))}
                </div>
              )}
              {canApply && <ArrowRight className='h-4 w-4 transition-all duration-200 group-hover:translate-x-2 group-hover:w-5' />}
              {!canApply && !hasPendingApplication && <Lock className='h-4 w-4' />}
            </span>
          </Link>
        </div>
        <div className='h-4'></div>
      </dl>
    </div>
  )
} 