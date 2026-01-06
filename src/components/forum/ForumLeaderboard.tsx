import { db } from '@/lib/db'
import { Trophy, Medal, Award, TrendingUp, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardUser {
    id: string
    username: string | null
    image: string | null
    solveCount: number
}

export async function ForumLeaderboard() {
    // Get top solvers
    const topSolvers = await db.user.findMany({
        where: {
            SolvedPosts: {
                some: {},
            },
        },
        select: {
            id: true,
            username: true,
            image: true,
            _count: {
                select: {
                    SolvedPosts: true,
                },
            },
        },
        orderBy: {
            SolvedPosts: {
                _count: 'desc',
            },
        },
        take: 10,
    })

    const leaderboard: LeaderboardUser[] = topSolvers.map((user) => ({
        id: user.id,
        username: user.username,
        image: user.image,
        solveCount: user._count.SolvedPosts,
    }))

    // Get stats
    const totalSolved = await db.post.count({
        where: {
            isSolved: true,
            subreddit: {
                name: 'general-forum',
            },
        },
    })

    const totalUnsolved = await db.post.count({
        where: {
            isSolved: false,
            subreddit: {
                name: 'general-forum',
            },
        },
    })

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className='h-5 w-5 text-yellow-500' />
            case 2:
                return <Medal className='h-5 w-5 text-gray-400' />
            case 3:
                return <Award className='h-5 w-5 text-amber-600' />
            default:
                return <span className='w-5 text-center text-sm font-bold text-gray-500'>#{rank}</span>
        }
    }

    return (
        <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3'>
                <h3 className='font-bold text-white flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Community Helpers
                </h3>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-2 gap-2 p-3 bg-gray-50 border-b'>
                <div className='flex items-center gap-2 text-sm'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    <span className='text-gray-600'>Solved:</span>
                    <span className='font-bold text-green-600'>{totalSolved}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                    <div className='h-4 w-4 rounded-full border-2 border-orange-400' />
                    <span className='text-gray-600'>Open:</span>
                    <span className='font-bold text-orange-600'>{totalUnsolved}</span>
                </div>
            </div>

            {/* Leaderboard */}
            <div className='divide-y divide-gray-100'>
                {leaderboard.length === 0 ? (
                    <div className='p-4 text-center text-gray-500 text-sm'>
                        <p>No solutions yet!</p>
                        <p className='text-xs mt-1'>Be the first to help others 🚀</p>
                    </div>
                ) : (
                    leaderboard.map((user, index) => (
                        <div
                            key={user.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''
                                }`}
                        >
                            <div className='flex-shrink-0 w-6 flex justify-center'>
                                {getMedalIcon(index + 1)}
                            </div>

                            <div className='flex-shrink-0'>
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.username || 'User'}
                                        className='h-8 w-8 rounded-full object-cover'
                                    />
                                ) : (
                                    <div className='h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm'>
                                        {user.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>

                            <div className='flex-1 min-w-0'>
                                <Link
                                    href={`/u/${user.username}`}
                                    className='font-medium text-gray-900 hover:text-emerald-600 truncate block'
                                >
                                    {user.username || 'Anonymous'}
                                </Link>
                            </div>

                            <div className='flex-shrink-0'>
                                <span className='inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold'>
                                    <CheckCircle2 className='h-3 w-3' />
                                    {user.solveCount}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className='px-4 py-3 bg-gray-50 border-t text-center'>
                <p className='text-xs text-gray-500'>
                    Help others solve their problems to climb the leaderboard! 🎯
                </p>
            </div>
        </div>
    )
}
