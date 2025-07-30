import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { threadId: string } }) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const thread = await db.dmThread.findUnique({
    where: { id: params.threadId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!thread) {
    return new Response('Thread not found', { status: 404 });
  }
  // Only allow if user is a participant
  if (thread.userAId !== session.user.id && thread.userBId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }
  return new Response(JSON.stringify(thread.messages));
} 