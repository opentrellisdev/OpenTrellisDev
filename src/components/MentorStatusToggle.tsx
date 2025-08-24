'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GraduationCap, Info } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

interface MentorStatusToggleProps {
  userType: 'FREE' | 'PAID' | 'MENTOR'
  userId: string
}

const MentorStatusToggle: FC<MentorStatusToggleProps> = ({ userType, userId }) => {
  const [isMentor, setIsMentor] = useState(userType === 'MENTOR')
  const [loading, setLoading] = useState(false)
  const [showExemptionDialog, setShowExemptionDialog] = useState(false)

  const handleBecomeMentor = async () => {
    setLoading(true)
    try {
      const response = await axios.patch('/api/user/mentor-status', { action: 'become_mentor' })
      setIsMentor(true)
      
      if (response.data.exemptionActive) {
        setShowExemptionDialog(true)
        toast({ description: 'Mentor status activated with subscription exemption!' })
      } else {
        toast({ description: 'Mentor status activated!' })
      }
    } catch (e) {
      console.error('Become mentor error:', e)
      toast({ description: 'Failed to become mentor. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleLoseMentor = async () => {
    setLoading(true)
    try {
      const response = await axios.patch('/api/user/mentor-status', { action: 'lose_mentor' })
      setIsMentor(false)
      
      if (response.data.exemptionActive === false && userType === 'PAID') {
        toast({ description: 'Mentor status removed. Your paid subscription has been reactivated.' })
      } else {
        toast({ description: 'Mentor status removed.' })
      }
    } catch (e) {
      console.error('Lose mentor error:', e)
      toast({ description: 'Failed to update mentor status. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
              disabled={!isMentor} // Disable the button - users can't just become mentors
              onClick={isMentor ? handleLoseMentor : undefined}
            >
              <GraduationCap className='h-4 w-4 mr-2' />
              {isMentor ? 'Remove Mentor Status' : 'Apply Required'}
            </Button>
            <span className={`font-medium ${isMentor ? 'text-blue-600' : 'text-zinc-400'}`}>Mentor</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className='text-xs text-zinc-500'>
            {isMentor
              ? 'You are an approved mentor. Your comments will appear in blue.'
              : 'Apply to become a mentor and help others grow. Apply now through Meet the Mentor.'
            }
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showExemptionDialog} onOpenChange={setShowExemptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Subscription Exemption Activated
            </DialogTitle>
            <DialogDescription>
              Congratulations on becoming a mentor! Your paid subscription has been temporarily suspended 
              while you maintain mentor status. You will not be charged during this period.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What this means:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Your monthly subscription charges are paused</li>
              <li>• You retain all paid features as a mentor</li>
              <li>• If you lose mentor status, your subscription will resume</li>
            </ul>
          </div>
          <Button 
            onClick={() => setShowExemptionDialog(false)}
            className="mt-4"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MentorStatusToggle 