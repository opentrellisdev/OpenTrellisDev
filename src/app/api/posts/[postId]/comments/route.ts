import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    if (!postId) {
      return new NextResponse('Post ID is required', { status: 400 })
    }

    console.log('Fetching comments for post:', postId)

    const comments = await db.comment.findMany({
      where: {
        postId: postId,
        replyToId: null, // Only top-level comments for now
      },
      include: {
        author: {
          select: {
            username: true,
            email: true,
            userType: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${comments.length} comments for post ${postId}`)

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
