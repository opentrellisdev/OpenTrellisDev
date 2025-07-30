const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMentorSystem() {
  try {
    console.log('🧪 Testing Mentor System...\n')

    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { email: 'saket.sambaraju@gmail.com' }
    })

    if (adminUser) {
      console.log('✅ Admin user found:')
      console.log(`   Name: ${adminUser.name}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   User Type: ${adminUser.userType}`)
      console.log(`   Mentor Applications Left: ${adminUser.mentorApplicationsLeft}`)
    } else {
      console.log('❌ Admin user not found')
    }

    // Check mentor applications
    const applications = await prisma.mentorApplication.findMany({
      include: { user: true }
    })

    console.log(`\n📋 Mentor Applications (${applications.length}):`)
    applications.forEach(app => {
      console.log(`   - ${app.name} (${app.user.email}): ${app.status}`)
    })

    // Check users with different types
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        userType: true,
        mentorApplicationsLeft: true
      },
      take: 5
    })

    console.log('\n👥 Sample Users:')
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): ${user.userType}, ${user.mentorApplicationsLeft} attempts left`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMentorSystem() 