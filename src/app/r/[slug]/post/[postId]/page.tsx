import EditorOutput from '@/components/EditorOutput'
import PostVoteServer from '@/components/post-vote/PostVoteServer'
import { buttonVariants } from '@/components/ui/Button'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { formatTimeToNow } from '@/lib/utils'
import { getAuthSession } from '@/lib/auth'
import { CachedPost } from '@/types/redis'
import { Post, User, Vote } from '@prisma/client'
import { ArrowBigDown, ArrowBigUp, Loader2 } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import SimpleCommentSection from '@/components/SimpleCommentSection'

interface SubRedditPostPageProps {
  params: {
    postId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  const session = await getAuthSession()

  let cachedPost: CachedPost | null = null
  let post: (Post & { votes: Vote[]; author: User }) | null = null

  try {
    cachedPost = (await redis.hgetall(
      `post:${params.postId}`
    )) as CachedPost

    if (!cachedPost) {
      post = await db.post.findFirst({
        where: {
          id: params.postId,
        },
        include: {
          votes: true,
          author: true,
          comments: true,
        },
      })
    }

    if (!post && !cachedPost) return notFound()
  } catch (error) {
    console.error('Error loading post:', error)
    return notFound()
  }

  return (
    <div>
      <div className='h-full flex flex-col sm:flex-row items-center sm:items-start justify-between'>
        <Suspense fallback={<PostVoteShell />}>
          {/* @ts-expect-error server component */}
          <PostVoteServer
            postId={post?.id ?? cachedPost.id}
            getData={async () => {
              return await db.post.findUnique({
                where: {
                  id: params.postId,
                },
                include: {
                  votes: true,
                },
              })
            }}
          />
        </Suspense>

        <div className='sm:w-0 w-full flex-1 bg-white p-4 rounded-sm'>
          <p className='max-h-40 mt-1 truncate text-xs text-gray-500'>
            Posted by u/{post?.author.username ?? cachedPost.authorUsername}{' '}
            {formatTimeToNow(new Date(post?.createdAt ?? cachedPost.createdAt))}
          </p>
          <h1 className='text-xl font-semibold py-2 leading-6 text-gray-900'>
            {post?.title ?? cachedPost.title}
          </h1>

          <EditorOutput content={post?.content ?? cachedPost.content} />
          
          {/* Comment Count */}
          <div className="mt-6 text-sm text-gray-500">
            {post?.comments?.length ?? 0} comments
          </div>
          
          {/* Simple Comment Section */}
          <div className="mt-8">
            <SimpleCommentSection postId={post?.id ?? cachedPost.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

function PostVoteShell() {
  return (
    <div className='flex items-center flex-col pr-6 w-20'>
      {/* upvote */}
      <div className={buttonVariants({ variant: 'ghost' })}>
        <ArrowBigUp className='h-5 w-5 text-zinc-700' />
      </div>

      {/* score */}
      <div className='text-center py-2 font-medium text-sm text-zinc-900'>
        <Loader2 className='h-3 w-3 animate-spin' />
      </div>

      {/* downvote */}
      <div className={buttonVariants({ variant: 'ghost' })}>
        <ArrowBigDown className='h-5 w-5 text-zinc-700' />
      </div>
    </div>
  )
}

export default SubRedditPostPage
