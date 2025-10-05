const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeMentor(email) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!existingUser) {
      console.log(`❌ User with email ${email} not found in database`)
      console.log('Make sure you have signed in with this email at least once')
      return
    }

    // Update user to be a mentor
    const user = await prisma.user.update({
      where: { email: email },
      data: {
        userType: 'MENTOR',
        role: 'ADMIN' // Mentors should also be admins
      }
    })

    console.log(`✅ Successfully made ${email} a MENTOR!`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`User Type: ${user.userType}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    console.log('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/make-mentor.js <email>')
  process.exit(1)
}

makeMentor(email)


