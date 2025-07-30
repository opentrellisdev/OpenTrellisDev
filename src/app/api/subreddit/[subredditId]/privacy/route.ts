import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { subredditId: string } }) {
  const session = await getAuthSession()
  if (!session?.user || session.user.userType !== 'PAID') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { isPrivate } = await req.json()
  const subreddit = await db.subreddit.findUnique({ where: { id: params.subredditId } })
  if (!subreddit || subreddit.creatorId !== session.user.id) {
    return new Response('Forbidden', { status: 403 })
  }
  await db.subreddit.update({
    where: { id: params.subredditId },
    data: { isPrivate },
  })
  return new Response('OK')
} 