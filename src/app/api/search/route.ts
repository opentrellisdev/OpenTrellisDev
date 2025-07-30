import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')
  const session = await getAuthSession()
  const isPaid = session?.user?.userType === 'PAID' || session?.user?.userType === 'MENTOR'

  if (!q) {
    // Return all communities for debugging
    const allCommunities = await db.subreddit.findMany({
      where: isPaid ? {} : { isPrivate: false },
      include: {
        _count: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return new Response(JSON.stringify(allCommunities))
  }

  const results = await db.subreddit.findMany({
    where: {
      name: {
        contains: q,
      },
      ...(isPaid ? {} : { isPrivate: false }),
    },
    include: {
      _count: true,
    },
    take: 5,
  })

  return new Response(JSON.stringify(results))
}
