import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      userType: true,
      image: true,
    },
  });
  if (!user) {
    return new Response('User not found', { status: 404 });
  }
  return new Response(JSON.stringify(user));
} 