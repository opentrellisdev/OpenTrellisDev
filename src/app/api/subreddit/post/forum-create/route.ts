import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'
import { NextRequest } from 'next/server'

const ForumPostValidator = z.object({
    title: z.string().min(3).max(128),
    content: z.any(),
    subredditId: z.string(),
    category: z.enum(['BUG_TECH', 'MARKETING', 'OPERATIONS', 'LEGAL', 'FUNDING', 'HIRING', 'OTHER']).optional(),
    businessStage: z.enum(['IDEA', 'MVP', 'REVENUE', 'SCALING']).optional(),
    pollQuestion: z.string().optional(),
    pollOptions: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const { title, content, subredditId, category, businessStage, pollQuestion, pollOptions } =
            ForumPostValidator.parse(body)

        const token = await getToken({
            req: req as NextRequest,
            secret: process.env.NEXTAUTH_SECRET
        })

        if (!token) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Check if this is the general-forum (allow posting without subscription)
        const subreddit = await db.subreddit.findFirst({
            where: { id: subredditId },
        })

        if (!subreddit) {
            return new Response('Community not found', { status: 404 })
        }

        const isGeneralForum = subreddit.name === 'general-forum'

        // For non-general-forum, verify subscription
        if (!isGeneralForum) {
            const subscription = await db.subscription.findFirst({
                where: {
                    subredditId,
                    userId: token.id,
                },
            })

            if (!subscription) {
                return new Response('Subscribe to post', { status: 403 })
            }
        }

        // Create the post with forum-specific fields
        const post = await db.post.create({
            data: {
                title,
                content,
                authorId: token.id,
                subredditId,
                category: category || null,
                businessStage: businessStage || null,
                isSolved: false,
            },
        })

        // Create poll if provided
        if (pollQuestion && pollOptions && pollOptions.length >= 2) {
            await db.poll.create({
                data: {
                    question: pollQuestion,
                    postId: post.id,
                    options: {
                        create: pollOptions
                            .filter(opt => opt.trim() !== '')
                            .map(optionText => ({
                                text: optionText,
                            })),
                    },
                },
            })
        }

        return new Response('OK')
    } catch (error) {
        console.error('Forum post creation error:', error)

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 400 })
        }

        return new Response(
            'Could not create post at this time. Please try later',
            { status: 500 }
        )
    }
}
