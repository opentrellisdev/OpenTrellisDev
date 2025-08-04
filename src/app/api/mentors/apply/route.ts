import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const MentorApplicationValidator = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.string().min(1, 'Age is required'),
  experience: z.string().min(10, 'Experience must be at least 10 characters').max(500, 'Experience must be 500 characters or less'),
  motivation: z.string().min(10, 'Motivation must be at least 10 characters').max(500, 'Motivation must be 500 characters or less'),
  revenue: z.string().min(1, 'Revenue information is required'),
  businessExplanation: z.string().min(10, 'Business explanation must be at least 10 characters').max(500, 'Business explanation must be 500 characters or less'),
})

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    console.log('Received mentor application data:', body)
    
    const { name, age, experience, motivation, revenue, businessExplanation } = MentorApplicationValidator.parse(body)

    // Check if user has remaining attempts
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mentorApplicationsLeft: true }
    })

    if (!user || user.mentorApplicationsLeft <= 0) {
      return new Response('No application attempts remaining', { status: 400 })
    }

    // Check if user already has a pending application
    const existingApplication = await db.mentorApplication.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return new Response('You already have a pending application', { status: 400 })
    }

    // Create the application and decrement attempts
    await db.$transaction(async (tx: any) => {
      await tx.mentorApplication.create({
        data: {
          userId: session.user.id,
          name,
          age: parseInt(age),
          experience,
          motivation,
          revenue,
          businessExplanation,
        }
      })
      
      await tx.user.update({
        where: { id: session.user.id },
        data: { mentorApplicationsLeft: user.mentorApplicationsLeft - 1 }
      })
    })

    return new Response('Application submitted successfully', { status: 200 })
  } catch (error) {
    console.error('Mentor application error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return new Response(`Invalid request data: ${error.errors.map(e => e.message).join(', ')}`, { status: 422 })
    }

    return new Response('Could not submit application', { status: 500 })
  }
} 