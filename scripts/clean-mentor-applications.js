const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanMentorApplications() {
  try {
    console.log('🧹 Cleaning up mentor applications...\n')

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

    // Verify the cleanup
    const applications = await prisma.mentorApplication.findMany()
    const mentors = await prisma.user.findMany({
      where: { userType: 'MENTOR' }
    })

    console.log('\n📋 Verification:')
    console.log(`   Applications remaining: ${applications.length}`)
    console.log(`   MENTOR users remaining: ${mentors.length}`)

    console.log('\n✅ Cleanup completed successfully!')
    console.log('   All users can now apply fresh with 2 attempts each.')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanMentorApplications() 