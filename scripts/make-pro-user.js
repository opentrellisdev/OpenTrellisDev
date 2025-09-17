const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeProUser(email) {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    })
    
    if (!existingUser) {
      console.log(`❌ User with email ${email} not found in database`)
      console.log('Make sure you have signed in with this email at least once')
      return
    }
    
    // Check if user is already pro
    if (existingUser.userType === 'PAID') {
      console.log(`ℹ️ User ${email} is already a pro user`)
      return
    }
    
    const user = await prisma.user.update({
      where: { email: email },
      data: { 
        userType: 'PAID',
        subscriptionStatus: 'ACTIVE'
      }
    })
    
    console.log(`✅ Successfully made ${email} a pro user!`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`User Type: ${user.userType}`)
    console.log(`Subscription Status: ${user.subscriptionStatus}`)
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function removeProUser(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { 
        userType: 'FREE',
        subscriptionStatus: 'INACTIVE'
      }
    })
    
    console.log(`✅ Successfully removed pro status from ${email}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`User Type: ${user.userType}`)
    console.log(`Subscription Status: ${user.subscriptionStatus}`)
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ User with email ${email} not found in database`)
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

async function listProUsers() {
  try {
    const proUsers = await prisma.user.findMany({
      where: { userType: 'PAID' },
      select: {
        id: true,
        email: true,
        username: true,
        userType: true,
        subscriptionStatus: true
      }
    })
    
    console.log('💎 Current Pro Users:')
    if (proUsers.length === 0) {
      console.log('No pro users found')
    } else {
      proUsers.forEach(user => {
        console.log(`- ${user.email} (${user.username}) - ${user.userType} - ${user.subscriptionStatus}`)
      })
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function main() {
  const command = process.argv[2]
  const email = process.argv[3]

  if (!command) {
    console.log('Usage:')
    console.log('  node scripts/make-pro-user.js make-pro <email>')
    console.log('  node scripts/make-pro-user.js remove-pro <email>')
    console.log('  node scripts/make-pro-user.js list-pro')
    return
  }

  switch (command) {
    case 'make-pro':
      if (!email) {
        console.log('❌ Please provide an email address')
        return
      }
      await makeProUser(email)
      break
    case 'remove-pro':
      if (!email) {
        console.log('❌ Please provide an email address')
        return
      }
      await removeProUser(email)
      break
    case 'list-pro':
      await listProUsers()
      break
    default:
      console.log('❌ Unknown command. Use: make-pro, remove-pro, or list-pro')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
