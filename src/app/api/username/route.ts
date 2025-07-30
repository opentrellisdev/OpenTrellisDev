import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { UsernameValidator } from '@/lib/validators/username'
import { z } from 'zod'

const UserTypeValidator = z.enum(['FREE', 'PAID', 'MENTOR'])

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    
    // Handle both username-only and username+userType requests
    let updateData: any = {}
    let previousUserType: 'FREE' | 'PAID' | 'MENTOR' | undefined = undefined;
    if (body.name !== undefined) {
      const { name } = UsernameValidator.parse({ name: body.name })
      // check if username is taken
      const username = await db.user.findFirst({
        where: {
          username: name,
        },
      })
      if (username) {
        return new Response('Username is taken', { status: 409 })
      }
      updateData.username = name
    }

    if (body.userType !== undefined) {
      const userType = UserTypeValidator.parse(body.userType)
      // Fetch previous userType
      const user = await db.user.findUnique({ where: { id: session.user.id }, select: { userType: true } })
      previousUserType = user?.userType
      updateData.userType = userType
    }

    if (Object.keys(updateData).length === 0) {
      return new Response('No valid fields to update', { status: 400 })
    }

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: updateData,
    })

    // Role downgrade cleanup logic
    if (previousUserType && body.userType !== undefined) {
      const newType = body.userType
      // If downgrading from PAID or MENTOR to FREE
      if ((previousUserType === 'PAID' || previousUserType === 'MENTOR') && newType === 'FREE') {
        // Unsubscribe from all private communities
        const privateSubs = await db.subscription.findMany({
          where: {
            userId: session.user.id,
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
              { userAId: session.user.id },
              { userBId: session.user.id },
            ],
          },
        })
        for (const thread of threads) {
          await db.message.deleteMany({ where: { threadId: thread.id } })
          await db.dmThread.delete({ where: { id: thread.id } })
        }
      }
    }

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }
    
    return new Response(
      'Could not update user at this time. Please try later',
      { status: 500 }
    )
  }
}
