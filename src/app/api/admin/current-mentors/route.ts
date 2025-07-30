import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 })
    }

    const mentors = await db.user.findMany({
      where: {
        userType: 'MENTOR'
      },
      select: {
        id: true,
        email: true,
        username: true,
        userType: true,
        MentorApplications: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true,
            name: true,
            updatedAt: true
          }
        }
      }
    })

    // Filter to only include users with approved applications
    const currentMentors = mentors.filter(user => user.MentorApplications.length > 0).map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.userType,
      mentorApplication: {
        id: user.MentorApplications[0].id,
        name: user.MentorApplications[0].name,
        approvedAt: user.MentorApplications[0].updatedAt.toISOString()
      }
    }))

    return new Response(JSON.stringify(currentMentors))
  } catch (error) {
    console.error('Error fetching current mentors:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 