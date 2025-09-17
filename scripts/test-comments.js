const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkComments() {
  try {
    console.log('🔍 Checking posts and comments...')
    
    // Get all posts
    const posts = await prisma.post.findMany({
      include: {
        comments: true,
        author: true,
        subreddit: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n📝 Found ${posts.length} posts:`)
    posts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`)
      console.log(`   - Author: ${post.author.username || post.author.email}`)
      console.log(`   - Subreddit: ${post.subreddit.name}`)
      console.log(`   - Comments: ${post.comments.length}`)
      console.log(`   - Post ID: ${post.id}`)
      console.log('')
    })
    
    // Get all comments
    const comments = await prisma.comment.findMany({
      include: {
        author: true,
        post: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n💬 Found ${comments.length} comments:`)
    comments.forEach((comment, index) => {
      console.log(`${index + 1}. "${comment.text.substring(0, 50)}..."`)
      console.log(`   - Author: ${comment.author.username || comment.author.email}`)
      console.log(`   - Post: "${comment.post.title}"`)
      console.log(`   - Created: ${comment.createdAt}`)
      console.log('')
    })
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function createTestComment() {
  try {
    console.log('🧪 Creating test comment...')
    
    // Get the first post
    const firstPost = await prisma.post.findFirst({
      include: {
        author: true
      }
    })
    
    if (!firstPost) {
      console.log('❌ No posts found to comment on')
      return
    }
    
    // Get the first user (or create a test user)
    let testUser = await prisma.user.findFirst()
    
    if (!testUser) {
      console.log('❌ No users found in database')
      return
    }
    
    // Create a test comment
    const comment = await prisma.comment.create({
      data: {
        text: 'This is a test comment to verify the comment system is working!',
        postId: firstPost.id,
        authorId: testUser.id
      },
      include: {
        author: true,
        post: true
      }
    })
    
    console.log('✅ Test comment created successfully!')
    console.log(`   - Comment ID: ${comment.id}`)
    console.log(`   - Author: ${comment.author.username || comment.author.email}`)
    console.log(`   - Post: "${comment.post.title}"`)
    console.log(`   - Text: "${comment.text}"`)
    
  } catch (error) {
    console.log('❌ Error creating test comment:', error.message)
  }
}

async function main() {
  const command = process.argv[2]

  if (!command) {
    console.log('Usage:')
    console.log('  node scripts/test-comments.js check')
    console.log('  node scripts/test-comments.js create-test')
    return
  }

  switch (command) {
    case 'check':
      await checkComments()
      break
    case 'create-test':
      await createTestComment()
      break
    default:
      console.log('❌ Unknown command. Use: check or create-test')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
