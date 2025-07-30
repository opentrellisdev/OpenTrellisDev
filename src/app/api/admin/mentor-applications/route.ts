import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await requireAdmin()

    const applications = await db.mentorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            userType: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Admin API - Found applications:', applications.length)
    applications.forEach(app => {
      console.log(`  - ${app.user.username} (${app.user.email}): ${app.status}`)
    })

    return new Response(JSON.stringify(applications))
  } catch (error) {
    console.error('Admin API error:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return new Response('Unauthorized', { status: 401 })
      }
      if (error.message === 'Insufficient permissions') {
        return new Response('Forbidden', { status: 403 })
      }
    }
    return new Response('Internal server error', { status: 500 })
  }
} 