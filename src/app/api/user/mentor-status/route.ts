import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

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