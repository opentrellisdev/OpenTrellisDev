import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase() || ''
  const userId = searchParams.get('userId')

  if (userId) {
    // Get a specific mentor profile
    const user = await db.user.findUnique({
      where: { id: userId, userType: 'MENTOR' },
      include: {
        MentorProfile: { include: { tags: true } },
      },
    })
    if (!user) return new Response('Not found', { status: 404 })
    return new Response(JSON.stringify(user))
  }

  // Get all mentors (with or without profile)
  const mentors = await db.user.findMany({
    where: {
      userType: 'MENTOR',
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { MentorProfile: { bio: { contains: q, mode: 'insensitive' } } },
              { MentorProfile: { tags: { some: { tag: { contains: q, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    },
    include: {
      MentorProfile: { include: { tags: true } },
    },
    orderBy: { username: 'asc' },
    take: 50,
  })
  return new Response(JSON.stringify(mentors))
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user || session.user.userType !== 'MENTOR') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { bio, tags, name, age } = await req.json()
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) {
    return new Response('Tags must be an array of strings', { status: 400 })
  }
  // Optionally update name/age on user
  await db.user.update({
    where: { id: session.user.id },
    data: { name, age },
  })
  // Upsert mentor profile
  const existing = await db.mentorProfile.findUnique({ where: { userId: session.user.id } })
  let profile
  if (existing) {
    // Update bio
    profile = await db.mentorProfile.update({
      where: { userId: session.user.id },
      data: { bio },
    })
    // Replace tags
    await db.mentorTag.deleteMany({ where: { mentorProfileId: profile.id } })
    for (const tag of tags) {
      await db.mentorTag.create({ data: { tag, mentorProfileId: profile.id } })
    }
  } else {
    profile = await db.mentorProfile.create({
      data: {
        userId: session.user.id,
        bio,
        tags: { create: tags.map((tag: string) => ({ tag })) },
      },
    })
  }
  // Return updated user with profile
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { MentorProfile: { include: { tags: true } } },
  })
  return new Response(JSON.stringify(user))
} 