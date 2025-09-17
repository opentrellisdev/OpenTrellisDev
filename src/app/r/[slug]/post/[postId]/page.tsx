interface SubRedditPostPageProps {
  params: {
    postId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  return (
    <div className="p-8">
      <div className="bg-red-500 text-white p-4 text-xl font-bold">
        🚨 TEST PAGE IS WORKING! 🚨
      </div>
      <div className="mt-4 p-4 bg-yellow-100">
        <p>Post ID: {params.postId}</p>
        <p>This is a test page to verify routing works</p>
      </div>
      <div className="mt-4 p-4 bg-green-100">
        <p>If you can see this, the routing is working!</p>
        <p>Now we can fix the actual post page.</p>
      </div>
    </div>
  )
}

export default SubRedditPostPage
