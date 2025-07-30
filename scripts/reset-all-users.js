const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetAllUsers() {
  try {
    console.log('🔄 Resetting all users to FREE with 2 attempts...\n')

    // Delete all existing mentor applications
    const deletedApplications = await prisma.mentorApplication.deleteMany({})
    console.log(`✅ Deleted ${deletedApplications.count} mentor applications`)

    // Reset all users to FREE and restore attempts
    const resetUsers = await prisma.user.updateMany({
      data: {
        userType: 'FREE',
        mentorApplicationsLeft: 2
      }
    })

    console.log(`✅ Reset ${resetUsers.count} users to FREE with 2 attempts`)

    // Verify the reset
    const applications = await prisma.mentorApplication.findMany()
    const mentors = await prisma.user.findMany({
      where: { userType: 'MENTOR' }
    })
    const usersWithAttempts = await prisma.user.findMany({
      where: { mentorApplicationsLeft: { gt: 0 } }
    })

    console.log('\n📋 Verification:')
    console.log(`   Applications remaining: ${applications.length}`)
    console.log(`   MENTOR users remaining: ${mentors.length}`)
    console.log(`   Users with attempts: ${usersWithAttempts.length}`)

    console.log('\n✅ Reset completed successfully!')
  } catch (error) {
    console.error('❌ Error during reset:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAllUsers() 