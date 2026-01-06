'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Award } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Comment {
    id: string
    text: string
    author: {
        id: string
        username: string | null
        image: string | null
    }
}

interface MarkSolvedProps {
    postId: string
    isSolved: boolean
    isAuthor: boolean
    solvedBy?: {
        id: string
        username: string | null
        image: string | null
    } | null
    solutionSummary?: string | null
    comments: Comment[]
}

export function MarkSolved({
    postId,
    isSolved,
    isAuthor,
    solvedBy,
    solutionSummary,
    comments,
}: MarkSolvedProps) {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [selectedComment, setSelectedComment] = useState<string>('')
    const [summary, setSummary] = useState('')

    const { mutate: markAsSolved, isPending: isSolving } = useMutation({
        mutationFn: async () => {
            const { data } = await axios.patch(`/api/subreddit/post/${postId}/solve`, {
                solvingCommentId: selectedComment,
                solutionSummary: summary,
            })
            return data
        },
        onSuccess: () => {
            toast({
                title: 'Marked as solved!',
                description: 'Thanks for letting the community know what worked.',
            })
            setShowModal(false)
            router.refresh()
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Could not mark as solved. Please try again.',
                variant: 'destructive',
            })
        },
    })

    const { mutate: markAsUnsolved, isPending: isUnsolving } = useMutation({
        mutationFn: async () => {
            const { data } = await axios.patch(`/api/subreddit/post/${postId}/unsolve`)
            return data
        },
        onSuccess: () => {
            toast({
                description: 'Post marked as unsolved.',
            })
            router.refresh()
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Could not update status. Please try again.',
                variant: 'destructive',
            })
        },
    })

    // If solved, show the solved badge
    if (isSolved) {
        return (
            <div className='space-y-3'>
                {/* Solved Badge */}
                <div className='flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg'>
                    <CheckCircle2 className='h-5 w-5 text-green-600' />
                    <span className='font-medium text-green-800'>Solved</span>
                    {solvedBy && (
                        <span className='text-green-600 text-sm'>
                            by <span className='font-semibold'>@{solvedBy.username}</span>
                        </span>
                    )}
                </div>

                {/* What Worked */}
                {solutionSummary && (
                    <div className='px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg'>
                        <p className='text-sm font-medium text-emerald-800 mb-1'>What worked:</p>
                        <p className='text-sm text-emerald-700'>{solutionSummary}</p>
                    </div>
                )}

                {/* Unsolve button (author only) */}
                {isAuthor && (
                    <button
                        onClick={() => markAsUnsolved()}
                        disabled={isUnsolving}
                        className='text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1'
                    >
                        {isUnsolving ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                            <XCircle className='h-4 w-4' />
                        )}
                        Mark as unsolved
                    </button>
                )}
            </div>
        )
    }

    // If not solved and not the author, show nothing
    if (!isAuthor) {
        return (
            <div className='flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm'>
                <div className='h-4 w-4 rounded-full border-2 border-orange-400' />
                <span className='text-orange-700'>Looking for solution</span>
            </div>
        )
    }

    // Author can mark as solved
    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm'
            >
                <CheckCircle2 className='h-4 w-4' />
                Mark as Solved
            </button>

            {/* Modal */}
            {showModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto'>
                        <div className='p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='p-2 bg-emerald-100 rounded-full'>
                                    <Award className='h-6 w-6 text-emerald-600' />
                                </div>
                                <div>
                                    <h3 className='font-bold text-lg'>Mark as Solved</h3>
                                    <p className='text-sm text-gray-500'>Let others know what helped!</p>
                                </div>
                            </div>

                            {/* Select helping comment */}
                            {comments.length > 0 && (
                                <div className='mb-4'>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Who helped solve this? (optional)
                                    </label>
                                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                                        <label className='flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50'>
                                            <input
                                                type='radio'
                                                name='solver'
                                                value=''
                                                checked={selectedComment === ''}
                                                onChange={() => setSelectedComment('')}
                                                className='text-emerald-600 focus:ring-emerald-500'
                                            />
                                            <span className='text-gray-600'>No specific comment</span>
                                        </label>
                                        {comments.map((comment) => (
                                            <label
                                                key={comment.id}
                                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedComment === comment.id ? 'border-emerald-500 bg-emerald-50' : ''
                                                    }`}
                                            >
                                                <input
                                                    type='radio'
                                                    name='solver'
                                                    value={comment.id}
                                                    checked={selectedComment === comment.id}
                                                    onChange={() => setSelectedComment(comment.id)}
                                                    className='mt-1 text-emerald-600 focus:ring-emerald-500'
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <p className='font-medium text-sm text-gray-900'>
                                                        @{comment.author.username}
                                                    </p>
                                                    <p className='text-sm text-gray-600 line-clamp-2'>
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* What worked summary */}
                            <div className='mb-6'>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    What worked? (helps others with similar issues)
                                </label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Briefly describe the solution that worked for you..."
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none'
                                    rows={3}
                                />
                            </div>

                            {/* Actions */}
                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => markAsSolved()}
                                    disabled={isSolving}
                                    className='flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2'
                                >
                                    {isSolving ? (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                        <CheckCircle2 className='h-4 w-4' />
                                    )}
                                    Confirm Solved
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
