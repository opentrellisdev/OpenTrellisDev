import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user || (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR')) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { receiverId, content } = await req.json()
  if (!receiverId || !content) {
    return new Response('Missing fields', { status: 400 })
  }
  if (receiverId === session.user.id) {
    return new Response('Cannot DM yourself', { status: 400 })
  }
  // Only allow sending to paid users or mentors
  const receiver = await db.user.findUnique({ where: { id: receiverId } })
  if (!receiver || (receiver.userType !== 'PAID' && receiver.userType !== 'MENTOR')) {
    return new Response('Receiver must be a paid user or mentor', { status: 400 })
  }
  // Find or create thread
  let thread = await db.dmThread.findFirst({
    where: {
      OR: [
        { userAId: session.user.id, userBId: receiverId },
        { userAId: receiverId, userBId: session.user.id },
      ],
    },
  })
  if (!thread) {
    thread = await db.dmThread.create({
      data: {
        userAId: session.user.id,
        userBId: receiverId,
        initiatorId: session.user.id,
        status: 'pending',
      },
    })
  }
  if (thread.status === 'rejected') {
    return new Response('This conversation was rejected', { status: 403 })
  }
  if (thread.status === 'pending' && thread.initiatorId !== session.user.id) {
    return new Response('Waiting for recipient to accept', { status: 403 })
  }
  // Allow message if accepted or pending (initiator)
  const message = await db.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content,
      threadId: thread.id,
    },
  })
  return new Response(JSON.stringify(message))
}

export async function GET(req: Request) {
  const session = await getAuthSession()
  if (!session?.user || (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR')) {
    return new Response('Unauthorized', { status: 401 })
  }
  // Fetch all threads for this user (not rejected)
  const threads = await db.dmThread.findMany({
    where: {
      OR: [
        { userAId: session.user.id },
        { userBId: session.user.id },
      ],
      NOT: { status: 'rejected' },
    },
    include: {
      messages: {
    orderBy: { createdAt: 'desc' },
        take: 1,
      },
      userA: true,
      userB: true,
      initiator: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
  // Filter out self-DMs
  const filtered = threads.filter((t: any) => t.userAId !== t.userBId)
  // Add myId for frontend
  const result = filtered.map((t: any) => ({
    ...t,
    latestMessage: t.messages[0] || null,
    myId: session.user.id,
  }))
  return new Response(JSON.stringify(result))
} 