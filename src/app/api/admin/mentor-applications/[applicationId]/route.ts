import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 })
    }

    const { action, removeAttempt } = await req.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response('Invalid action', { status: 400 })
    }

    // Get the application
    const application = await db.mentorApplication.findUnique({
      where: { id: params.applicationId },
      include: { user: true }
    })

    if (!application) {
      return new Response('Application not found', { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return new Response('Application is not pending', { status: 400 })
    }

    if (action === 'approve') {
      // Approve the application and make user a mentor
      await db.$transaction(async (tx: any) => {
        // Update application status
        await tx.mentorApplication.update({
          where: { id: params.applicationId },
          data: { status: 'APPROVED' }
        })

        // Update user type to MENTOR
        await tx.user.update({
          where: { id: application.userId },
          data: { userType: 'MENTOR' }
        })
      })

      return new Response('Application approved successfully')
    } else if (action === 'reject') {
      // Reject the application
      await db.$transaction(async (tx: any) => {
        // Update application status
        await tx.mentorApplication.update({
          where: { id: params.applicationId },
          data: { status: 'REJECTED' }
        })

        // Handle attempt management
        if (removeAttempt === true) {
          // Don't decrement - the attempt was already consumed during application
          // Just leave the attempts as they are
        } else if (removeAttempt === false) {
          // Give the attempt back since admin chose to keep attempts
          await tx.user.update({
            where: { id: application.userId },
            data: {
              mentorApplicationsLeft: {
                increment: 1
              }
            }
          })
        }
        // If removeAttempt is undefined, keep attempts unchanged
      })

      return new Response('Application rejected successfully')
    }

    return new Response('Invalid action', { status: 400 })
  } catch (error) {
    console.error('Error processing mentor application:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 