const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    })
    
    console.log(`✅ Successfully made ${email} an admin!`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ User with email ${email} not found in database`)
      console.log('Make sure you have signed in with this email at least once')
    } else {
      console.log('❌ Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Make saket.sambaraju@gmail.com an admin
makeAdmin('saket.sambaraju@gmail.com') 