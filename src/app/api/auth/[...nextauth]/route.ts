import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"
import { db } from "@/lib/db"

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async session({ session, token, user }) {
      if (session?.user) {
        session.user.userType = token.userType || 'FREE'
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userType = user.userType || 'FREE'
        
        // Additional auto-subscription check for new users
        if (trigger === 'signIn') {
          try {
            const openTrellisSubreddit = await db.subreddit.findUnique({
              where: { name: 'OpenTrellis' }
            })
            
            if (openTrellisSubreddit) {
              const existingSubscription = await db.subscription.findUnique({
                where: {
                  userId_subredditId: {
                    userId: user.id,
                    subredditId: openTrellisSubreddit.id
                  }
                }
              })
              
              if (!existingSubscription) {
                await db.subscription.create({
                  data: {
                    userId: user.id,
                    subredditId: openTrellisSubreddit.id
                  }
                })
                console.log('Auto-subscribed user on sign-in:', user.email)
              }
            }
          } catch (error) {
            console.error('Error auto-subscribing on sign-in:', error)
          }
        }
      }
      return token
    },
  },
})

export { handler as GET, handler as POST }