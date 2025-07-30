const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndSetAdmin() {
  try {
    // Find the user by email
    const user = await prisma.user.findFirst({
      where: {
        email: 'saket.sambaraju@gmail.com'
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User found:')
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Current role: ${user.role}`)
    console.log(`   User type: ${user.userType}`)

    if (user.role !== 'ADMIN') {
      console.log('🔧 Setting role to ADMIN...')
      
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      })

      console.log('✅ Role updated to ADMIN')
    } else {
      console.log('✅ User already has ADMIN role')
    }

    // Verify the update
    const updatedUser = await prisma.user.findFirst({
      where: { email: 'saket.sambaraju@gmail.com' }
    })

    console.log(`\n📋 Final status:`)
    console.log(`   Role: ${updatedUser.role}`)
    console.log(`   User type: ${updatedUser.userType}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndSetAdmin() 