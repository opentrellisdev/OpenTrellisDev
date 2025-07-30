const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMentorRemoval() {
  try {
    console.log('🧪 Testing mentor removal logic...\n')

    // Get a test user
    const user = await prisma.user.findFirst({
      where: { mentorApplicationsLeft: { gt: 0 } }
    })

    if (!user) {
      console.log('❌ No users with attempts found')
      return
    }

    console.log(`📋 Test User: ${user.email}`)
    console.log(`   Initial attempts: ${user.mentorApplicationsLeft}`)
    console.log(`   Initial user type: ${user.userType}`)

    // Make user a mentor
    console.log('\n👨‍🏫 Making user a mentor...')
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: 'MENTOR' }
    })

    // Create an approved application
    const application = await prisma.mentorApplication.create({
      data: {
        userId: user.id,
        name: 'Test User',
        age: 25,
        experience: 'Test experience',
        motivation: 'Test motivation',
        status: 'APPROVED'
      }
    })

    const userAsMentor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true, mentorApplicationsLeft: true }
    })
    console.log(`   User type as mentor: ${userAsMentor.userType}`)
    console.log(`   Attempts as mentor: ${userAsMentor.mentorApplicationsLeft}`)

    // Remove mentor status
    console.log('\n❌ Removing mentor status...')
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: 'FREE' }
    })

    const userAfterRemoval = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true, mentorApplicationsLeft: true }
    })
    console.log(`   User type after removal: ${userAfterRemoval.userType}`)
    console.log(`   Attempts after removal: ${userAfterRemoval.mentorApplicationsLeft}`)

    // Clean up
    await prisma.mentorApplication.delete({
      where: { id: application.id }
    })

    // Reset user
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: 'FREE', mentorApplicationsLeft: 2 }
    })

    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMentorRemoval() 