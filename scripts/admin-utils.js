const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin(email) {
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
    
    // Check if user is already an admin
    if (existingUser.role === 'ADMIN') {
      console.log(`ℹ️ User ${email} is already an admin`)
      return
    }
    
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    })
    
    console.log(`✅ Successfully made ${email} an admin!`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function removeAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'USER' }
    })
    
    console.log(`✅ Successfully removed admin role from ${email}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Username: ${user.username}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ User with email ${email} not found in database`)
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        userType: true
      }
    })
    
    console.log('👑 Current Admin Users:')
    if (admins.length === 0) {
      console.log('No admin users found')
    } else {
      admins.forEach(admin => {
        console.log(`- ${admin.email} (${admin.username}) - ${admin.userType}`)
      })
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

async function cleanupDuplicateAdmins() {
  try {
    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    })
    
    console.log(`Found ${admins.length} admin users`)
    
    // Group by email to find duplicates
    const emailGroups = {}
    admins.forEach(admin => {
      if (!emailGroups[admin.email]) {
        emailGroups[admin.email] = []
      }
      emailGroups[admin.email].push(admin)
    })
    
    // Check for duplicates
    let duplicatesFound = false
    for (const [email, users] of Object.entries(emailGroups)) {
      if (users.length > 1) {
        duplicatesFound = true
        console.log(`⚠️ Found ${users.length} admin accounts for ${email}:`)
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}, Username: ${user.username}`)
        })
        
        // Keep the first one, remove the rest
        const toRemove = users.slice(1)
        for (const user of toRemove) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'USER' }
          })
          console.log(`✅ Removed admin role from duplicate: ${user.id}`)
        }
      }
    }
    
    if (!duplicatesFound) {
      console.log('✅ No duplicate admin accounts found')
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
    console.log('  node scripts/admin-utils.js make-admin <email>')
    console.log('  node scripts/admin-utils.js remove-admin <email>')
    console.log('  node scripts/admin-utils.js list-admins')
    console.log('  node scripts/admin-utils.js cleanup-duplicates')
    return
  }

  switch (command) {
    case 'make-admin':
      if (!email) {
        console.log('❌ Please provide an email address')
        return
      }
      await makeAdmin(email)
      break
    case 'remove-admin':
      if (!email) {
        console.log('❌ Please provide an email address')
        return
      }
      await removeAdmin(email)
      break
    case 'list-admins':
      await listAdmins()
      break
    case 'cleanup-duplicates':
      await cleanupDuplicateAdmins()
      break
    default:
      console.log('❌ Unknown command. Use: make-admin, remove-admin, list-admins, or cleanup-duplicates')
  }

  await prisma.$disconnect()
}

main().catch(console.error) 