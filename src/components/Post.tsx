'use client'

import { formatTimeToNow } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { FC, useRef, useState, useEffect } from 'react'
import EditorOutput from './EditorOutput'
import PostVoteClient from './post-vote/PostVoteClient'
import { useSession } from 'next-auth/react'
import DMModal from './DMModal'
import UserPopup from './UserPopup';

type PartialVote = {
  type: 'UP' | 'DOWN'
}

interface PostProps {
  post: {
    id: string
    title: string
    content: string
    createdAt: Date
    author: {
      id: string
      username: string | null
      userType: 'FREE' | 'PAID' | 'MENTOR'
      image: string | null
    }
    votes: any[]
  }
  votesAmt: number
  subredditName: string
  currentVote?: PartialVote
  commentAmt: number
}

const Post: FC<PostProps> = ({
  post,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
  subredditName,
  commentAmt,
}) => {
  const pRef = useRef<HTMLParagraphElement>(null)
  const { data: session } = useSession()
  const [showDM, setShowDM] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const usernameRef = useRef<HTMLSpanElement>(null)
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsPaidUser(post.author?.userType === 'PAID' || post.author?.userType === 'MENTOR')
  }, [post.author])

  // Ensure consistent username rendering
  const username = post.author?.username && typeof post.author.username === 'string' && post.author.username.trim().length > 0
    ? post.author.username.trim()
    : 'Unknown'

  // Get username color based on user type
  const getUsernameColor = () => {
    if (post.author?.userType === 'MENTOR') return 'text-blue-600 font-bold'
    if (post.author?.userType === 'PAID') return 'text-yellow-500 font-bold'
    return 'text-zinc-700'
  }

  return (
    <div className='rounded-md bg-white shadow'>
      <div className='px-6 py-4 flex justify-between'>
        <PostVoteClient
          postId={post.id}
          initialVotesAmt={_votesAmt}
          initialVote={_currentVote?.type}
        />

        <div className='w-0 flex-1'>
          <div className='max-h-40 mt-1 text-xs text-gray-500'>
            {subredditName ? (
              <>
                <a
                  className='underline text-zinc-900 text-sm underline-offset-2'
                  href={`/r/${subredditName}`}>
                  r/{subredditName}
                </a>
                <span className='px-1'>•</span>
              </>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                ref={usernameRef}
                className={`underline cursor-pointer underline-offset-2 ${getUsernameColor()}`}
                onClick={() => setShowUserPopup((v) => !v)}
              >
                u/{username}
              </span>
              {showUserPopup && post.author?.username && post.author?.id && post.author?.id !== session?.user?.id && (
                <UserPopup
                  username={post.author.username}
                  userId={post.author.id}
                  userType={post.author.userType}
                  currentUser={session?.user ? { 
                    id: session.user.id, 
                    userType: session.user.userType as 'FREE' | 'PAID' | 'MENTOR', 
                    image: session.user.image 
                  } : null}
                  onDM={() => {
                    setShowUserPopup(false);
                    setShowDM(true);
                  }}
                  onClose={() => setShowUserPopup(false)}
                  anchorRef={usernameRef}
                  userImage={post.author.image}
                />
              )}
              {showDM && (
                <DMModal
                  receiverId={post.author?.id}
                  receiverUsername={post.author?.username}
                  onClose={() => setShowDM(false)}
                />
              )}
            </div>
            {formatTimeToNow(new Date(post.createdAt))}
          </div>
          <h1 className='text-lg font-semibold py-2 leading-6 text-gray-900'>
            {post.title}
          </h1>

          <div
            className='relative text-sm max-h-40 w-full overflow-clip'
            ref={pRef}>
            <EditorOutput content={post.content} />
            {pRef.current?.clientHeight === 160 ? (
              // blur bottom if content is too long
              <div className='absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent'></div>
            ) : null}
          </div>
        </div>
      </div>

      <div className='bg-gray-50 z-20 text-sm px-4 py-4 sm:px-6'>
        <Link
          href={`/r/${subredditName}/post/${post.id}`}
          className='w-fit flex items-center gap-2'>
          <MessageSquare className='h-4 w-4' /> {commentAmt} comments
        </Link>
      </div>
    </div>
  )
}
export default Post
