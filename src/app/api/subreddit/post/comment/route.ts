import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommentValidator } from '@/lib/validators/comment'
import { z } from 'zod'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    console.log('Comment request body:', body)

    const { postId, text, replyToId } = CommentValidator.parse(body)

    const session = await getAuthSession()
    console.log('Comment session:', session?.user?.email)

    if (!session?.user) {
      console.log('Unauthorized comment attempt')
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      console.log('Post not found:', postId)
      return new Response('Post not found', { status: 404 })
    }

    console.log('Creating comment for post:', postId, 'by user:', session.user.email)

    // Create the comment
    const comment = await db.comment.create({
      data: {
        text,
        postId,
        authorId: session.user.id,
        replyToId,
      },
    })

    console.log('Comment created successfully:', comment.id)
    return new Response('OK')
  } catch (error) {
    console.error('Comment creation error:', error)
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      'Could not create comment at this time. Please try later',
      { status: 500 }
    )
  }
}
