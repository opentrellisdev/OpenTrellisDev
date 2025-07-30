const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAttemptLogic() {
  try {
    console.log('🧪 Testing attempt management logic...\n')

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

    // Simulate application submission (decrements attempts)
    console.log('\n📝 Simulating application submission...')
    const application = await prisma.mentorApplication.create({
      data: {
        userId: user.id,
        name: 'Test User',
        age: 25,
        experience: 'Test experience',
        motivation: 'Test motivation'
      }
    })

    // Manually decrement attempts to simulate the API behavior
    await prisma.user.update({
      where: { id: user.id },
      data: { mentorApplicationsLeft: user.mentorApplicationsLeft - 1 }
    })

    // Check attempts after application
    const userAfterApplication = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mentorApplicationsLeft: true }
    })
    console.log(`   Attempts after application: ${userAfterApplication.mentorApplicationsLeft}`)

    // Simulate rejection with "keep attempt consumed"
    console.log('\n❌ Simulating rejection with "keep attempt consumed"...')
    await prisma.mentorApplication.update({
      where: { id: application.id },
      data: { status: 'REJECTED' }
    })
    // Don't change attempts - they stay as they are

    const userAfterRejection1 = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mentorApplicationsLeft: true }
    })
    console.log(`   Attempts after rejection (keep consumed): ${userAfterRejection1.mentorApplicationsLeft}`)

    // Simulate rejection with "return attempt"
    console.log('\n❌ Simulating rejection with "return attempt"...')
    await prisma.user.update({
      where: { id: user.id },
      data: { mentorApplicationsLeft: userAfterRejection1.mentorApplicationsLeft + 1 }
    })

    const userAfterRejection2 = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mentorApplicationsLeft: true }
    })
    console.log(`   Attempts after rejection (return attempt): ${userAfterRejection2.mentorApplicationsLeft}`)

    // Clean up
    await prisma.mentorApplication.delete({
      where: { id: application.id }
    })

    // Reset user attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { mentorApplicationsLeft: 2 }
    })

    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAttemptLogic() 