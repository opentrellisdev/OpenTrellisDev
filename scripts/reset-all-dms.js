const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetAllDMs() {
  try {
    console.log('🔄 Deleting all DMs (messages and threads)...\n')

    // Delete all messages
    const deletedMessages = await prisma.message.deleteMany({})
    console.log(`✅ Deleted ${deletedMessages.count} messages`)

    // Delete all DM threads
    const deletedThreads = await prisma.dmThread.deleteMany({})
    console.log(`✅ Deleted ${deletedThreads.count} DM threads`)

    // Verification
    const messages = await prisma.message.findMany()
    const threads = await prisma.dmThread.findMany()
    console.log('\n📋 Verification:')
    console.log(`   Messages remaining: ${messages.length}`)
    console.log(`   DM threads remaining: ${threads.length}`)

    console.log('\n✅ All DMs deleted successfully!')
  } catch (error) {
    console.error('❌ Error during DM reset:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAllDMs() 