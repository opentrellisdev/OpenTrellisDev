import { Editor } from '@/components/Editor'
import { ForumEditor } from '@/components/forum/ForumEditor'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { MessageCircle, HelpCircle } from 'lucide-react'

interface pageProps {
  params: {
    slug: string
  }
}

const page = async ({ params }: pageProps) => {
  const subreddit = await db.subreddit.findFirst({
    where: {
      name: params.slug,
    },
  })

  if (!subreddit) return notFound()

  const isGeneralForum = subreddit.name === 'general-forum'

  return (
    <div className='flex flex-col items-start gap-6'>
      {/* heading */}
      <div className='border-b border-gray-200 pb-5 w-full'>
        <div className='-ml-2 -mt-2 flex flex-wrap items-baseline'>
          <h3 className='ml-2 mt-2 text-base font-semibold leading-6 text-gray-900 flex items-center gap-2'>
            {isGeneralForum ? (
              <>
                <HelpCircle className='h-5 w-5 text-emerald-600' />
                Ask the Community
              </>
            ) : (
              'Create Post'
            )}
          </h3>
          <p className='ml-2 mt-1 truncate text-sm text-gray-500'>
            in r/{params.slug}
          </p>
        </div>
        {isGeneralForum && (
          <p className='mt-2 text-sm text-gray-600'>
            Get help from other businesses! Add tags to help people find and answer your question.
          </p>
        )}
      </div>

      {/* form - use ForumEditor for general-forum */}
      {isGeneralForum ? (
        <ForumEditor subredditId={subreddit.id} />
      ) : (
        <>
          <Editor subredditId={subreddit.id} />
          <div className='w-full flex justify-end'>
            <Button type='submit' className='w-full' form='subreddit-post-form'>
              Post
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default page

