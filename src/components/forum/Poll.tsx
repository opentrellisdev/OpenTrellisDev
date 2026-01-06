'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Check, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface PollOption {
    id: string
    text: string
    _count: {
        votes: number
    }
}

interface PollProps {
    pollId: string
    question: string
    options: PollOption[]
    userVotedOptionId?: string | null
    totalVotes: number
    endsAt?: Date | null
    isLoggedIn: boolean
}

export function Poll({
    pollId,
    question,
    options,
    userVotedOptionId,
    totalVotes,
    endsAt,
    isLoggedIn,
}: PollProps) {
    const router = useRouter()
    const [selectedOption, setSelectedOption] = useState<string | null>(userVotedOptionId || null)
    const [hasVoted, setHasVoted] = useState(!!userVotedOptionId)
    const [localVotes, setLocalVotes] = useState<Record<string, number>>({})

    // Initialize local votes from options
    useEffect(() => {
        const votes: Record<string, number> = {}
        options.forEach(opt => {
            votes[opt.id] = opt._count.votes
        })
        setLocalVotes(votes)
    }, [options])

    const totalCount = Object.values(localVotes).reduce((a, b) => a + b, 0)

    const { mutate: vote, isPending } = useMutation({
        mutationFn: async (optionId: string) => {
            const { data } = await axios.post(`/api/poll/${pollId}/vote`, { optionId })
            return data
        },
        onSuccess: (_, optionId) => {
            setSelectedOption(optionId)
            setHasVoted(true)
            setLocalVotes(prev => ({
                ...prev,
                [optionId]: (prev[optionId] || 0) + 1,
            }))
            toast({
                description: 'Your vote has been recorded!',
            })
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Could not submit vote. Please try again.',
                variant: 'destructive',
            })
        },
    })

    const handleVote = (optionId: string) => {
        if (!isLoggedIn) {
            toast({
                title: 'Please sign in',
                description: 'You need to be signed in to vote.',
                variant: 'destructive',
            })
            return
        }
        if (hasVoted || isPending) return
        vote(optionId)
    }

    const isExpired = endsAt ? new Date(endsAt) < new Date() : false

    return (
        <div className='border border-gray-200 rounded-lg overflow-hidden bg-white'>
            {/* Header */}
            <div className='px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b flex items-center gap-2'>
                <BarChart2 className='h-5 w-5 text-purple-600' />
                <span className='font-semibold text-gray-800'>Poll</span>
                <span className='ml-auto text-sm text-gray-500'>
                    {totalCount} vote{totalCount !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Question */}
            <div className='px-4 py-3 border-b'>
                <p className='font-medium text-gray-900'>{question}</p>
            </div>

            {/* Options */}
            <div className='p-4 space-y-2'>
                {options.map((option) => {
                    const voteCount = localVotes[option.id] || 0
                    const percentage = totalCount > 0 ? Math.round((voteCount / totalCount) * 100) : 0
                    const isSelected = selectedOption === option.id

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted || isPending || isExpired}
                            className={`w-full relative overflow-hidden rounded-lg border transition-all ${hasVoted || isExpired
                                    ? 'cursor-default'
                                    : 'cursor-pointer hover:border-purple-400 hover:shadow-sm'
                                } ${isSelected
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                        >
                            {/* Progress bar background */}
                            {(hasVoted || isExpired) && (
                                <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected ? 'bg-purple-200' : 'bg-gray-100'
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            {/* Content */}
                            <div className='relative px-4 py-3 flex items-center gap-3'>
                                {/* Radio/Check indicator */}
                                <div
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                            ? 'border-purple-500 bg-purple-500'
                                            : 'border-gray-300'
                                        }`}
                                >
                                    {isSelected && <Check className='h-3 w-3 text-white' />}
                                </div>

                                {/* Option text */}
                                <span className={`flex-1 text-left ${isSelected ? 'font-medium' : ''}`}>
                                    {option.text}
                                </span>

                                {/* Vote count / percentage */}
                                {(hasVoted || isExpired) && (
                                    <span className='text-sm font-medium text-gray-600'>
                                        {percentage}%
                                    </span>
                                )}

                                {/* Loading indicator */}
                                {isPending && selectedOption === option.id && (
                                    <Loader2 className='h-4 w-4 animate-spin text-purple-600' />
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Footer */}
            {isExpired && (
                <div className='px-4 py-2 bg-gray-50 border-t text-center'>
                    <span className='text-sm text-gray-500'>Poll ended</span>
                </div>
            )}

            {!isLoggedIn && !hasVoted && (
                <div className='px-4 py-2 bg-gray-50 border-t text-center'>
                    <span className='text-sm text-gray-500'>Sign in to vote</span>
                </div>
            )}
        </div>
    )
}
