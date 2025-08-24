import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: { mentorId: string } }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 })
    }

    const mentor = await db.user.findUnique({
      where: { id: params.mentorId },
      select: {
        id: true,
        userType: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        mentorExemptionActive: true,
        MentorApplications: {
          where: { status: 'APPROVED' },
          select: { id: true }
        }
      }
    })

    if (!mentor) {
      return new Response('Mentor not found', { status: 404 })
    }

    if (mentor.userType !== 'MENTOR') {
      return new Response('User is not a mentor', { status: 400 })
    }

    // Determine what user type to revert to based on subscription status
    let newUserType: 'FREE' | 'PAID' = 'FREE'
    
    if (mentor.mentorExemptionActive && mentor.stripeSubscriptionId) {
      // User had a paid subscription before becoming mentor, reactivate it
      newUserType = 'PAID'
    }

    // Update user type and clear mentor exemption
    await db.user.update({
      where: { id: params.mentorId },
      data: { 
        userType: newUserType,
        mentorExemptionActive: false,
        mentorExemptionStartDate: null,
        // If reactivating paid subscription, set status back to active
        ...(newUserType === 'PAID' && { subscriptionStatus: 'ACTIVE' })
      }
    })

    // Role downgrade cleanup logic
    // Unsubscribe from all private communities and delete all DMs if user is now FREE
    if (newUserType === 'FREE') {
      // Unsubscribe from all private communities
      const privateSubs = await db.subscription.findMany({
        where: {
          userId: params.mentorId,
          subreddit: { isPrivate: true },
        },
      })
      for (const sub of privateSubs) {
        await db.subscription.delete({
          where: { userId_subredditId: { userId: sub.userId, subredditId: sub.subredditId } },
        })
      }
      // Delete all DMs (threads and messages)
      const threads = await db.dmThread.findMany({
        where: {
          OR: [
            { userAId: params.mentorId },
            { userBId: params.mentorId },
          ],
        },
      })
      for (const thread of threads) {
        await db.message.deleteMany({ where: { threadId: thread.id } })
        await db.dmThread.delete({ where: { id: thread.id } })
      }
    }

    const statusMessage = newUserType === 'PAID' 
      ? 'Mentor status removed. Paid subscription reactivated.'
      : 'Mentor status removed successfully'

    return new Response(statusMessage, { status: 200 })
  } catch (error) {
    console.error('Error removing mentor status:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 