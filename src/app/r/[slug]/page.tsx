import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import axios from 'axios'

interface PageProps {
  params: {
    slug: string
  }
}

const page = async ({ params }: PageProps) => {
  const { slug } = params

  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: INFINITE_SCROLL_PAGINATION_RESULTS,
      },
      Creator: true,
    },
  })

  if (!subreddit) return notFound()

  const isCreator = session?.user?.id === subreddit.creatorId
  const isPaid = session?.user?.userType === 'PAID' || session?.user?.userType === 'MENTOR'

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        r/{subreddit.name}
      </h1>
      {isCreator && isPaid && (
        <form
          action={async (formData) => {
            'use server'
            const isPrivate = formData.get('isPrivate') === 'on'
            await axios.patch(`/api/subreddit/${subreddit.id}/privacy`, { isPrivate })
          }}
          className='mb-4 flex items-center gap-2'>
          <input
            type='checkbox'
            id='private-toggle'
            name='isPrivate'
            defaultChecked={subreddit.isPrivate}
            className='accent-blue-600 h-4 w-4 rounded border-gray-300'
          />
          <label htmlFor='private-toggle' className='text-sm'>
            Private Community (only paid users can view)
          </label>
          <Button type='submit' size='sm'>Save</Button>
        </form>
      )}
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  )
}

export default page
