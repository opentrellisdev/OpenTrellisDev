'use client'

import { FC } from 'react'
import { Button } from '@/components/ui/Button'
import { GraduationCap } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'

interface MentorStatusToggleProps {
  userType: 'FREE' | 'PAID' | 'MENTOR'
  userId: string
}

const MentorStatusToggle: FC<MentorStatusToggleProps> = ({ userType, userId }) => {
  const isMentor = userType === 'MENTOR'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor Status</CardTitle>
        <CardDescription>
          Your mentor application status and privileges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-4'>
          <span className={`font-medium ${!isMentor ? 'text-green-600' : 'text-zinc-400'}`}>Not Mentor</span>
          <Button
            type='button'
            variant={isMentor ? 'default' : 'outline'}
            className={`px-6 ${isMentor ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
            disabled={true}
          >
            <GraduationCap className='h-4 w-4 mr-2' />
            {isMentor ? 'Mentor Approved' : 'Apply Required'}
          </Button>
          <span className={`font-medium ${isMentor ? 'text-blue-600' : 'text-zinc-400'}`}>Mentor</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className='text-xs text-zinc-500'>
          {isMentor
            ? 'You are an approved mentor. Your comments will appear in blue.'
            : 'Apply to become a mentor and help others grow.'
          }
        </div>
      </CardFooter>
    </Card>
  )
}

export default MentorStatusToggle 