import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const pendingApplication = await db.mentorApplication.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    return new Response(JSON.stringify({ 
      hasPendingApplication: !!pendingApplication 
    }))
  } catch (error) {
    return new Response('Internal server error', { status: 500 })
  }
} 

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { action } = await req.json()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        userType: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        mentorExemptionActive: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    if (action === 'become_mentor') {
      // If user was previously paid, activate mentor exemption
      if (user.userType === 'PAID' && user.subscriptionStatus === 'ACTIVE') {
        await db.user.update({
          where: { id: user.id },
          data: {
            userType: 'MENTOR',
            mentorExemptionActive: true,
            mentorExemptionStartDate: new Date(),
          },
        })

        return NextResponse.json({
          message: 'Mentor status activated with subscription exemption',
          exemptionActive: true,
        })
      } else {
        // User was free, just become mentor
        await db.user.update({
          where: { id: user.id },
          data: {
            userType: 'MENTOR',
            mentorExemptionActive: false,
          },
        })

        return NextResponse.json({
          message: 'Mentor status activated',
          exemptionActive: false,
        })
      }
    } else if (action === 'lose_mentor') {
      // If user had exemption, reactivate their paid subscription
      if (user.mentorExemptionActive && user.stripeSubscriptionId) {
        await db.user.update({
          where: { id: user.id },
          data: {
            userType: 'PAID',
            mentorExemptionActive: false,
            mentorExemptionStartDate: null,
            subscriptionStatus: 'ACTIVE',
          },
        })

        return NextResponse.json({
          message: 'Mentor status removed, paid subscription reactivated',
          exemptionActive: false,
        })
      } else {
        // User was free mentor, just become free
        await db.user.update({
          where: { id: user.id },
          data: {
            userType: 'FREE',
            mentorExemptionActive: false,
            mentorExemptionStartDate: null,
          },
        })

        return NextResponse.json({
          message: 'Mentor status removed',
          exemptionActive: false,
        })
      }
    }

    return new NextResponse('Invalid action', { status: 400 })
  } catch (error) {
    console.error('Error updating mentor status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 