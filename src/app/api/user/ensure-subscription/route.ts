import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Ensuring subscription for user:', session.user.email)

    // Get OpenTrellis subreddit
    const openTrellisSubreddit = await db.subreddit.findUnique({
      where: { name: 'OpenTrellis' }
    })

    if (!openTrellisSubreddit) {
      return new NextResponse('OpenTrellis community not found', { status: 404 })
    }

    // Check if already subscribed
    const existingSubscription = await db.subscription.findUnique({
      where: {
        userId_subredditId: {
          userId: session.user.id,
          subredditId: openTrellisSubreddit.id
        }
      }
    })

    if (existingSubscription) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already subscribed',
        subscribed: true 
      })
    }

    // Create subscription
    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: openTrellisSubreddit.id
      }
    })

    console.log('Successfully subscribed user to OpenTrellis:', session.user.email)

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to OpenTrellis',
      subscribed: true 
    })

  } catch (error) {
    console.error('Error ensuring subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ensure subscription' },
      { status: 500 }
    )
  }
}
