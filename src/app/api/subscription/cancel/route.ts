import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { cancelSubscription } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        userType: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        mentorExemptionActive: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // If user is a mentor with exemption, just deactivate exemption
    if (user.userType === 'MENTOR' && user.mentorExemptionActive) {
      await db.user.update({
        where: { id: user.id },
        data: {
          mentorExemptionActive: false,
          mentorExemptionStartDate: null,
          userType: 'FREE',
        },
      })

      return NextResponse.json({ message: 'Mentor exemption deactivated' })
    }

    // If no active subscription, just downgrade to free
    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'ACTIVE') {
      await db.user.update({
        where: { id: user.id },
        data: {
          userType: 'FREE',
          subscriptionStatus: 'INACTIVE',
        },
      })

      return NextResponse.json({ message: 'Subscription cancelled' })
    }

    // Cancel Stripe subscription
    await cancelSubscription(user.stripeSubscriptionId)

    // Update user status
    await db.user.update({
      where: { id: user.id },
      data: {
        userType: 'FREE',
        subscriptionStatus: 'CANCELED',
      },
    })

    return NextResponse.json({ message: 'Subscription cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 