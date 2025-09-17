const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCommentAPI() {
  try {
    console.log('🧪 Testing comment API logic...')
    
    const postId = 'cmfokbsov0003jp0ay3quo4ag' // The post with comments
    
    console.log(`\n📝 Testing post ID: ${postId}`)
    
    // Test the same query that the API uses
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        replyToId: null, // Only top-level comments for now
      },
      include: {
        author: {
          select: {
            username: true,
            email: true,
            userType: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n✅ Found ${comments.length} comments for post ${postId}:`)
    comments.forEach((comment, index) => {
      console.log(`${index + 1}. "${comment.text}"`)
      console.log(`   - Author: ${comment.author.username || comment.author.email}`)
      console.log(`   - User Type: ${comment.author.userType}`)
      console.log(`   - Created: ${comment.createdAt}`)
      console.log('')
    })
    
    // Also test the post query
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
      include: {
        votes: true,
        author: true,
        comments: true,
      },
    })
    
    if (post) {
      console.log(`\n📄 Post details:`)
      console.log(`   - Title: "${post.title}"`)
      console.log(`   - Author: ${post.author.username || post.author.email}`)
      console.log(`   - Comments in post query: ${post.comments.length}`)
      console.log(`   - Comments in separate query: ${comments.length}`)
    } else {
      console.log(`\n❌ Post not found!`)
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function main() {
  await testCommentAPI()
  await prisma.$disconnect()
}

main().catch(console.error)
