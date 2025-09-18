import { db } from '@/lib/db'
import SimpleCommentSection from '@/components/SimpleCommentSection'
import { formatTimeToNow } from '@/lib/utils'

interface SubRedditPostPageProps {
  params: {
    postId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  try {
    // Simple database query
    const post = await db.post.findFirst({
      where: {
        id: params.postId,
      },
      include: {
        author: true,
        comments: true,
      },
    })

    if (!post) {
      return (
        <div className="p-8">
          <div className="bg-red-500 text-white p-4 text-xl font-bold">
            ❌ Post not found!
          </div>
          <div className="mt-4 p-4 bg-yellow-100">
            <p>Post ID: {params.postId}</p>
            <p>This post does not exist in the database.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto p-4">
        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Posted by u/{post.author.username || post.author.email} • {formatTimeToNow(new Date(post.createdAt))}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          </div>
          
          <div className="prose max-w-none">
            <div className="text-gray-800 leading-relaxed">
              {post.content && typeof post.content === 'object' && post.content.blocks ? (
                post.content.blocks.map((block: any, index: number) => (
                  <div key={index} className="mb-4">
                    {block.type === 'paragraph' && (
                      <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                    )}
                    {block.type === 'list' && (
                      <ul className="list-disc list-inside">
                        {block.data.items.map((item: string, itemIndex: number) => (
                          <li key={itemIndex} className="mb-1">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p>Content not available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Comments ({post.comments.length})
            </h2>
            <SimpleCommentSection postId={post.id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading post:', error)
    return (
      <div className="p-8">
        <div className="bg-red-500 text-white p-4 text-xl font-bold">
          ❌ Error loading post!
        </div>
        <div className="mt-4 p-4 bg-yellow-100">
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Post ID: {params.postId}</p>
        </div>
      </div>
    )
  }
}

export default SubRedditPostPage
