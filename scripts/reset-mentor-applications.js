const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetMentorApplications() {
  try {
    console.log('🔄 Resetting mentor applications and user types...\n')

    // Reset all mentor applications to PENDING
    const resetApplications = await prisma.mentorApplication.updateMany({
      where: {
        status: {
          in: ['APPROVED', 'REJECTED']
        }
      },
      data: {
        status: 'PENDING'
      }
    })

    console.log(`✅ Reset ${resetApplications.count} mentor applications to PENDING`)

    // Reset all MENTOR users back to FREE
    const resetUsers = await prisma.user.updateMany({
      where: {
        userType: 'MENTOR'
      },
      data: {
        userType: 'FREE'
      }
    })

    console.log(`✅ Reset ${resetUsers.count} MENTOR users back to FREE`)

    // Reset mentorApplicationsLeft to 2 for all users
    const resetAttempts = await prisma.user.updateMany({
      data: {
        mentorApplicationsLeft: 2
      }
    })

    console.log(`✅ Reset mentor applications left to 2 for all users`)

    // Verify the reset
    const applications = await prisma.mentorApplication.findMany()
    const users = await prisma.user.findMany({
      where: {
        userType: 'MENTOR'
      }
    })

    console.log('\n📋 Verification:')
    console.log(`   Applications: ${applications.length} total`)
    console.log(`   PENDING applications: ${applications.filter(a => a.status === 'PENDING').length}`)
    console.log(`   MENTOR users remaining: ${users.length}`)

    console.log('\n✅ Reset completed successfully!')

  } catch (error) {
    console.error('❌ Error during reset:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetMentorApplications() 