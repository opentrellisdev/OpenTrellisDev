const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedGeneralForum() {
    try {
        // Check if general-forum already exists
        const existingForum = await prisma.subreddit.findFirst({
            where: { name: 'general-forum' }
        })

        if (existingForum) {
            console.log('✅ General Forum already exists!')
            console.log(`ID: ${existingForum.id}`)
            console.log(`Name: ${existingForum.name}`)
            console.log(`Created: ${existingForum.createdAt}`)
            return existingForum
        }

        // Create the general-forum community (no creator - it's a system community)
        const forum = await prisma.subreddit.create({
            data: {
                name: 'general-forum',
                isPrivate: false, // Public so everyone can access
            }
        })

        console.log('✅ General Forum created successfully!')
        console.log(`ID: ${forum.id}`)
        console.log(`Name: ${forum.name}`)
        console.log(`Created: ${forum.createdAt}`)
        console.log('')
        console.log('🎉 The General Forum is now available at /r/general-forum')
        console.log('   Users can create posts, upload images, and comment to help other businesses!')

        return forum
    } catch (error) {
        console.log('❌ Error creating General Forum:', error.message)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

seedGeneralForum()
