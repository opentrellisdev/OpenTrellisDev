import { db } from '@/lib/db'
import SimpleCommentSection from '@/components/SimpleCommentSection'

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
      <div className="p-8">
        <div className="bg-green-500 text-white p-4 text-xl font-bold">
          ✅ Post Found!
        </div>
        
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <p className="text-gray-600 mb-2">
            Posted by u/{post.author.username || post.author.email}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {post.createdAt.toLocaleDateString()}
          </p>
          
          <div className="mb-6">
            <p className="text-gray-800">{JSON.stringify(post.content)}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-lg font-semibold">
              Comments ({post.comments.length})
            </p>
          </div>
          
          <div className="border-t pt-6">
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
