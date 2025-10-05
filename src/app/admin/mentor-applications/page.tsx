'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { GraduationCap, CheckCircle, XCircle, UserX, X, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MentorApplication {
  id: string
  name: string
  age: number
  experience: string
  motivation: string
  revenue: string | null
  businessExplanation: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  user: {
    id: string
    email: string
    username: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
  }
}

interface CurrentMentor {
  id: string
  email: string
  username: string | null
  userType: 'MENTOR'
  mentorApplication: {
    id: string
    name: string
    approvedAt: string
  }
}

export default function MentorApplicationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [currentMentors, setCurrentMentors] = useState<CurrentMentor[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'remove'
    id: string
    name: string
    removeAttempt?: boolean
  } | null>(null)

  useEffect(() => {
    if (session === null) {
      router.push('/sign-in')
      return
    }

    if (session === undefined) {
      return // Wait for session to load
    }

    if (!session.user) {
      router.push('/sign-in')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      const [applicationsRes, mentorsRes] = await Promise.all([
        axios.get('/api/admin/mentor-applications'),
        axios.get('/api/admin/current-mentors')
      ])
      setApplications(applicationsRes.data)
      setCurrentMentors(mentorsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleAction = async (applicationId: string, action: 'approve' | 'reject') => {
    setConfirmAction({
      type: action,
      id: applicationId,
      name: applications.find(app => app.id === applicationId)?.name || 'Unknown'
    })
    setShowConfirmDialog(true)
  }

  const handleRemoveMentor = async (mentorId: string) => {
    const mentor = currentMentors.find(m => m.id === mentorId)
    setConfirmAction({
      type: 'remove',
      id: mentorId,
      name: mentor?.mentorApplication.name || 'Unknown'
    })
    setShowConfirmDialog(true)
  }

  const executeAction = async () => {
    if (!confirmAction) return

    setLoading(true)
    try {
      if (confirmAction.type === 'remove') {
        await axios.patch(`/api/admin/mentors/${confirmAction.id}/remove`)
        toast({
          title: 'Mentor Removed',
          description: 'Mentor status has been removed successfully.',
        })
      } else {
        const payload = confirmAction.type === 'reject' 
          ? { action: confirmAction.type, removeAttempt: confirmAction.removeAttempt }
          : { action: confirmAction.type }
        
        await axios.patch(`/api/admin/mentor-applications/${confirmAction.id}`, payload)
        toast({
          title: 'Application Updated',
          description: `Application ${confirmAction.type === 'approve' ? 'approved' : 'rejected'} successfully.`,
        })
      }
      fetchData() // Refresh data
      setSelectedApplication(null) // Close the modal
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const truncateText = (text: string, maxLength: number = 10) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Show loading while checking session
  if (session === undefined) {
    return (
      <div className='w-full max-w-6xl mx-auto px-4 py-8'>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-zinc-600'>Loading session...</p>
        </div>
      </div>
    )
  }



  return (
    <div className='w-full max-w-6xl mx-auto px-4 py-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Admin Panel - Mentor Management</h1>
        <p className='text-zinc-600'>Review mentor applications and manage current mentors.</p>
      </div>

      {/* Current Mentors Section */}
      <div className='mb-8'>
        <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
          <GraduationCap className='h-6 w-6 text-blue-600' />
          Current Mentors ({currentMentors.length})
        </h2>
        <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>User</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Approved</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {currentMentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='text-sm font-medium text-gray-900'>
                          u/{mentor.username || 'Unknown'}
                        </div>
                        <div className='ml-2'>
                          <span className='bg-blue-600 text-white px-2 py-1 rounded text-xs'>Mentor</span>
                        </div>
                      </div>
                      <div className='text-sm text-gray-500'>{mentor.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {mentor.mentorApplication.name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(mentor.mentorApplication.approvedAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <Button
                        onClick={() => handleRemoveMentor(mentor.id)}
                        disabled={loading}
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                      >
                        <UserX className='h-4 w-4 mr-1' />
                        Remove Mentor
                      </Button>
                    </td>
                  </tr>
                ))}
                {currentMentors.length === 0 && (
                  <tr>
                    <td colSpan={4} className='px-6 py-4 text-center text-gray-500'>
                      No current mentors
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div>
        <h2 className='text-2xl font-semibold mb-4'>Pending Applications ({applications.filter(app => app.status === 'PENDING').length})</h2>
        <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Applicant</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Age</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Revenue</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Experience</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Motivation</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {applications.map((application) => (
                  <tr key={application.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='text-sm font-medium text-gray-900'>
                          u/{application.user.username || 'Unknown'}
                        </div>
                        <div className='ml-2'>
                          <span className={`px-2 py-1 rounded text-xs ${
                            application.user.userType === 'PAID' 
                              ? 'bg-yellow-400 text-white' 
                              : 'bg-zinc-300 text-zinc-700'
                          }`}>
                            {application.user.userType}
                          </span>
                        </div>
                      </div>
                      <div className='text-sm text-gray-500'>{application.user.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {application.name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {application.age}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {application.revenue || 'N/A'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900 max-w-xs truncate' title={application.experience}>
                        {truncateText(application.experience, 10)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900 max-w-xs truncate' title={application.motivation}>
                        {truncateText(application.motivation, 10)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex gap-2'>
                        <Button
                          onClick={() => setSelectedApplication(application)}
                          variant='outline'
                          size='sm'
                          className='text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        >
                          <Eye className='h-4 w-4 mr-1' />
                          View
                        </Button>
                        {application.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleAction(application.id, 'approve')}
                              disabled={loading}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700 text-white'
                            >
                              <CheckCircle className='h-4 w-4 mr-1' />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAction(application.id, 'reject')}
                              disabled={loading}
                              variant='outline'
                              size='sm'
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            >
                              <XCircle className='h-4 w-4 mr-1' />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={8} className='px-6 py-4 text-center text-gray-500'>
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-xl font-semibold'>Application Details</h3>
              <Button
                onClick={() => setSelectedApplication(null)}
                variant='ghost'
                size='sm'
                className='text-gray-500 hover:text-gray-700'
              >
                <X className='h-5 w-5' />
              </Button>
            </div>
            
            <div className='space-y-4'>
              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Applicant Information</h4>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p><strong>Name:</strong> {selectedApplication.name}</p>
                  <p><strong>Age:</strong> {selectedApplication.age}</p>
                  <p><strong>Username:</strong> u/{selectedApplication.user.username || 'Unknown'}</p>
                  <p><strong>Email:</strong> {selectedApplication.user.email}</p>
                  <p><strong>User Type:</strong> {selectedApplication.user.userType}</p>
                  <p><strong>Status:</strong> {selectedApplication.status}</p>
                </div>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Experience</h4>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p className='whitespace-pre-wrap'>{selectedApplication.experience}</p>
                </div>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Motivation</h4>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p className='whitespace-pre-wrap'>{selectedApplication.motivation}</p>
                </div>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Revenue Level</h4>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p className='font-medium'>{selectedApplication.revenue || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Business Context</h4>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p className='whitespace-pre-wrap'>{selectedApplication.businessExplanation || 'Not provided'}</p>
                </div>
              </div>

              {selectedApplication.status === 'PENDING' && (
                <div className='flex gap-3 pt-4'>
                  <Button
                    onClick={() => handleAction(selectedApplication.id, 'approve')}
                    disabled={loading}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Approve Application
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedApplication.id, 'reject')}
                    disabled={loading}
                    variant='outline'
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <XCircle className='h-4 w-4 mr-2' />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>
              {confirmAction.type === 'approve' && 'Approve Application'}
              {confirmAction.type === 'reject' && 'Reject Application'}
              {confirmAction.type === 'remove' && 'Remove Mentor Status'}
            </h3>
            
            <p className='text-gray-600 mb-6'>
              {confirmAction.type === 'approve' && `Are you sure you want to approve ${confirmAction.name}'s mentor application? This will grant them mentor status and paid features.`}
              {confirmAction.type === 'reject' && `Are you sure you want to reject ${confirmAction.name}'s mentor application?`}
              {confirmAction.type === 'remove' && `Are you sure you want to remove ${confirmAction.name}'s mentor status? This will revert them to a FREE user.`}
            </p>

            {confirmAction.type === 'reject' && (
              <div className='mb-6'>
                <p className='text-sm text-gray-600 mb-3'>Attempt Management:</p>
                <div className='space-y-2'>
                  <label className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='attemptOption'
                      value='keep'
                      checked={confirmAction.removeAttempt === false}
                      onChange={() => setConfirmAction(prev => prev ? { ...prev, removeAttempt: false } : null)}
                      className='accent-red-600'
                    />
                    <span className='text-sm'>Keep Attempt (user gets their attempt back and can apply again)</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='attemptOption'
                      value='remove'
                      checked={confirmAction.removeAttempt === true}
                      onChange={() => setConfirmAction(prev => prev ? { ...prev, removeAttempt: true } : null)}
                      className='accent-red-600'
                    />
                    <span className='text-sm'>Remove Attempt (user loses 1 attempt permanently)</span>
                  </label>
                </div>
              </div>
            )}

            <div className='flex gap-3 justify-end'>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false)
                  setConfirmAction(null)
                }}
                variant='outline'
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={loading || (confirmAction.type === 'reject' && confirmAction.removeAttempt === undefined)}
                className={
                  confirmAction.type === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : confirmAction.type === 'reject'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 