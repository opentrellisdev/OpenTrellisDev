const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupComments() {
  try {
    console.log('🧹 Cleaning up test comments...')
    
    const postId = 'cmfokbsov0003jp0ay3quo4ag' // The "Welcome to OpenTrellis" post
    
    // Delete all existing comments for this post
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        postId: postId
      }
    })
    
    console.log(`✅ Deleted ${deletedComments.count} test comments`)
    
    // Get the first user (SaketS)
    const user = await prisma.user.findFirst({
      where: {
        email: 'saket.sambaraju@gmail.com'
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    // Create the new comment
    const newComment = await prisma.comment.create({
      data: {
        text: 'Sounds good!',
        postId: postId,
        authorId: user.id
      },
      include: {
        author: true,
        post: true
      }
    })
    
    console.log('✅ Created new comment:')
    console.log(`   - Text: "${newComment.text}"`)
    console.log(`   - Author: ${newComment.author.username || newComment.author.email}`)
    console.log(`   - Post: "${newComment.post.title}"`)
    
    // Verify the final state
    const finalComments = await prisma.comment.findMany({
      where: {
        postId: postId
      },
      include: {
        author: true
      }
    })
    
    console.log(`\n📊 Final state: ${finalComments.length} comment(s) for the post`)
    finalComments.forEach((comment, index) => {
      console.log(`${index + 1}. "${comment.text}" by ${comment.author.username || comment.author.email}`)
    })
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function main() {
  await cleanupComments()
  await prisma.$disconnect()
}

main().catch(console.error)
