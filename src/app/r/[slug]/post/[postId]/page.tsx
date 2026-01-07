import { db } from '@/lib/db'
import SimpleCommentSection from '@/components/SimpleCommentSection'
import { formatTimeToNow } from '@/lib/utils'
import { getAuthSession } from '@/lib/auth'
import { MarkSolved } from '@/components/forum/MarkSolved'
import { PostTags } from '@/components/forum/PostTags'
import { Poll } from '@/components/forum/Poll'

interface SubRedditPostPageProps {
  params: {
    postId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  try {
    const session = await getAuthSession()

    // Fetch post with all related data including poll and solver
    const post = await db.post.findFirst({
      where: {
        id: params.postId,
      },
      include: {
        author: true,
        subreddit: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        solvedBy: true,
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
          },
        },
      },
    })

    if (!post) {
      return (
        <div className="p-8">
          <div className="bg-red-500 text-white p-4 text-xl font-bold rounded-lg">
            Post not found!
          </div>
          <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
            <p>Post ID: {params.postId}</p>
            <p>This post does not exist in the database.</p>
          </div>
        </div>
      )
    }

    const isAuthor = session?.user?.id === post.authorId
    const isGeneralForum = post.subreddit?.name === 'general-forum'

    // Check if user has voted on the poll
    let userVotedOptionId: string | null = null
    if (session?.user && post.poll) {
      const vote = await db.pollVote.findFirst({
        where: {
          voterId: session.user.id,
          option: {
            pollId: post.poll.id,
          },
        },
      })
      userVotedOptionId = vote?.optionId || null
    }

    // Format comments for MarkSolved
    const formattedComments = post.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        image: comment.author.image,
      },
    }))

    // Calculate total votes for poll
    const totalPollVotes = post.poll?.options.reduce(
      (acc, opt) => acc + opt._count.votes,
      0
    ) || 0

    return (
      <div className="max-w-4xl mx-auto p-4">
        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Posted by u/{post.author.username || post.author.email} • {formatTimeToNow(new Date(post.createdAt))}
            </p>

            {/* Tags (Category, Stage, Solved) */}
            {isGeneralForum && (
              <div className="mb-3">
                <PostTags
                  category={post.category}
                  stage={post.businessStage}
                  isSolved={post.isSolved}
                />
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          </div>

          {/* Mark as Solved / Unsolved Section (General Forum only) */}
          {isGeneralForum && (
            <div className="mb-6">
              <MarkSolved
                postId={post.id}
                isSolved={post.isSolved}
                isAuthor={isAuthor}
                solvedBy={post.solvedBy}
                solutionSummary={post.solutionSummary}
                comments={formattedComments}
              />
            </div>
          )}

          {/* Post Content */}
          <div className="prose max-w-none">
            <div className="text-gray-800 leading-relaxed">
              {post.content && typeof post.content === 'object' && 'blocks' in post.content ? (
                (post.content as any).blocks.map((block: any, index: number) => (
                  <div key={index} className="mb-4">
                    {block.type === 'paragraph' && (
                      <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                    )}
                    {block.type === 'header' && (
                      <h2 className="text-xl font-bold my-3">{block.data.text}</h2>
                    )}
                    {block.type === 'list' && (
                      <ul className="list-disc list-inside">
                        {block.data.items.map((item: string, itemIndex: number) => (
                          <li key={itemIndex} className="mb-1">{item}</li>
                        ))}
                      </ul>
                    )}
                    {block.type === 'image' && (
                      <div className="my-4">
                        <img
                          src={block.data.file?.url || block.data.url}
                          alt={block.data.caption || 'Image'}
                          className="max-w-full rounded-lg border border-gray-200"
                        />
                        {block.data.caption && (
                          <p className="text-sm text-gray-500 mt-1 text-center">{block.data.caption}</p>
                        )}
                      </div>
                    )}
                    {block.type === 'code' && (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{block.data.code}</code>
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <p>Content not available</p>
              )}
            </div>
          </div>

          {/* Poll Section */}
          {post.poll && (
            <div className="mt-6">
              <Poll
                pollId={post.poll.id}
                question={post.poll.question}
                options={post.poll.options.map((opt) => ({
                  id: opt.id,
                  text: opt.text,
                  _count: { votes: opt._count.votes },
                }))}
                userVotedOptionId={userVotedOptionId}
                totalVotes={totalPollVotes}
                endsAt={post.poll.endsAt}
                isLoggedIn={!!session?.user}
              />
            </div>
          )}
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
        <div className="bg-red-500 text-white p-4 text-xl font-bold rounded-lg">
          Error loading post!
        </div>
        <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Post ID: {params.postId}</p>
        </div>
      </div>
    )
  }
}

export default SubRedditPostPage

