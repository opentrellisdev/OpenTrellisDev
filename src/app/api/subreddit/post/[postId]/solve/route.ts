import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'
import { NextRequest } from 'next/server'

const SolveValidator = z.object({
    solvingCommentId: z.string().optional(),
    solutionSummary: z.string().optional(),
})

export async function PATCH(
    req: Request,
    { params }: { params: { postId: string } }
) {
    try {
        const body = await req.json()
        const { solvingCommentId, solutionSummary } = SolveValidator.parse(body)

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

        // Only the author can mark as solved
        if (post.authorId !== token.id) {
            return new Response('Only the author can mark this as solved', { status: 403 })
        }

        // If a comment was selected, get the solver's user ID
        let solvedById: string | null = null
        if (solvingCommentId) {
            const comment = await db.comment.findFirst({
                where: { id: solvingCommentId },
                select: { authorId: true },
            })
            if (comment) {
                solvedById = comment.authorId
            }
        }

        // Update the post
        await db.post.update({
            where: { id: params.postId },
            data: {
                isSolved: true,
                solvedAt: new Date(),
                solvedById,
                solvingCommentId: solvingCommentId || null,
                solutionSummary: solutionSummary || null,
            },
        })

        return new Response('OK')
    } catch (error) {
        console.error('Solve error:', error)

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 400 })
        }

        return new Response(
            'Could not mark as solved. Please try later',
            { status: 500 }
        )
    }
}
