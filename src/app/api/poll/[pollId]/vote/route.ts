import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'
import { NextRequest } from 'next/server'

const VoteValidator = z.object({
    optionId: z.string(),
})

export async function POST(
    req: Request,
    { params }: { params: { pollId: string } }
) {
    try {
        const body = await req.json()
        const { optionId } = VoteValidator.parse(body)

        const token = await getToken({
            req: req as NextRequest,
            secret: process.env.NEXTAUTH_SECRET
        })

        if (!token) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Verify the poll exists
        const poll = await db.poll.findFirst({
            where: { id: params.pollId },
            include: { options: true },
        })

        if (!poll) {
            return new Response('Poll not found', { status: 404 })
        }

        // Check if poll has expired
        if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
            return new Response('Poll has ended', { status: 400 })
        }

        // Verify the option belongs to this poll
        const optionBelongsToPoll = poll.options.some(opt => opt.id === optionId)
        if (!optionBelongsToPoll) {
            return new Response('Invalid option', { status: 400 })
        }

        // Check if user already voted in this poll
        const existingVote = await db.pollVote.findFirst({
            where: {
                voterId: token.id,
                option: {
                    pollId: params.pollId,
                },
            },
        })

        if (existingVote) {
            return new Response('Already voted', { status: 400 })
        }

        // Create the vote
        await db.pollVote.create({
            data: {
                optionId,
                voterId: token.id,
            },
        })

        return new Response('OK')
    } catch (error) {
        console.error('Poll vote error:', error)

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 400 })
        }

        return new Response(
            'Could not submit vote. Please try later',
            { status: 500 }
        )
    }
}
