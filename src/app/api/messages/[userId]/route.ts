import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { DmThreadStatus } from '@prisma/client';

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = params.userId;
  if (userId === session.user.id) {
    return new Response('Cannot accept/reject self-DM', { status: 400 });
  }
  const { action } = await req.json(); // action: 'accept' | 'reject'
  // Find the thread
  const thread = await db.dmThread.findFirst({
    where: {
      OR: [
        { userAId: session.user.id, userBId: userId },
        { userAId: userId, userBId: session.user.id },
      ],
      status: DmThreadStatus.pending,
    },
  });
  if (!thread) {
    return new Response('No pending DM request found', { status: 404 });
  }
  // Only the recipient can accept/reject
  if (thread.initiatorId === session.user.id) {
    return new Response('Only the recipient can accept/reject', { status: 403 });
  }
  if (action === 'accept') {
    await db.dmThread.update({ where: { id: thread.id }, data: { status: DmThreadStatus.accepted } });
    return new Response('Accepted', { status: 200 });
  } else if (action === 'reject') {
    await db.dmThread.update({ where: { id: thread.id }, data: { status: DmThreadStatus.rejected } });
    return new Response('Rejected', { status: 200 });
  } else {
    return new Response('Invalid action', { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = params.userId;
  if (userId === session.user.id) {
    return new Response('Cannot delete self-DM', { status: 400 });
  }
  // Find the thread
  const thread = await db.dmThread.findFirst({
    where: {
      OR: [
        { userAId: session.user.id, userBId: userId },
        { userAId: userId, userBId: session.user.id },
      ],
    },
  });
  if (!thread) {
    return new Response('No DM thread found', { status: 404 });
  }
  // Delete all messages in the thread
  await db.message.deleteMany({ where: { threadId: thread.id } });
  // Delete the thread
  await db.dmThread.delete({ where: { id: thread.id } });
  return new Response(null, { status: 204 });
} 