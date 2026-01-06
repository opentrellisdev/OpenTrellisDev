import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function PATCH(
    req: Request,
    { params }: { params: { postId: string } }
) {
    try {
        const token = await getToken({
            req: req as NextRequest,
            secret: process.env.NEXTAUTH_SECRET
        })

        if (!token) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Get the post
        const post = await db.post.findFirst({
            where: { id: params.postId },
        })

        if (!post) {
            return new Response('Post not found', { status: 404 })
        }

        // Only the author can mark as unsolved
        if (post.authorId !== token.id) {
            return new Response('Only the author can change the solved status', { status: 403 })
        }

        // Update the post
        await db.post.update({
            where: { id: params.postId },
            data: {
                isSolved: false,
                solvedAt: null,
                solvedById: null,
                solvingCommentId: null,
                solutionSummary: null,
            },
        })

        return new Response('OK')
    } catch (error) {
        console.error('Unsolve error:', error)

        return new Response(
            'Could not update status. Please try later',
            { status: 500 }
        )
    }
}
