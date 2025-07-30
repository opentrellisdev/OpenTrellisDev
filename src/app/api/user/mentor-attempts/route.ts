import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mentorApplicationsLeft: true }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    return new Response(JSON.stringify({ mentorApplicationsLeft: user.mentorApplicationsLeft }))
  } catch (error) {
    return new Response('Internal server error', { status: 500 })
  }
} 