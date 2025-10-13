import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { SubredditValidator } from '@/lib/validators/subreddit'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { name } = SubredditValidator.parse(body)
    const isPrivate = body.isPrivate === true && (token.userType === 'PAID' || token.userType === 'MENTOR')

    // check if subreddit already exists
    const subredditExists = await db.subreddit.findFirst({
      where: {
        name,
      },
    })

    if (subredditExists) {
      return new Response('Subreddit already exists', { status: 409 })
    }

    // create subreddit and associate it with the user
    const subreddit = await db.subreddit.create({
      data: {
        name,
        Creator: { connect: { id: token.id } },
        isPrivate,
      },
    })

    // creator also has to be subscribed
    await db.subscription.create({
      data: {
        userId: token.id,
        subredditId: subreddit.id,
      },
    })

    return new Response(subreddit.name)
  } catch (error) {
    console.error('Error creating subreddit:', error)
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 })
    }

    return new Response('Could not create subreddit', { status: 500 })
  }
}
