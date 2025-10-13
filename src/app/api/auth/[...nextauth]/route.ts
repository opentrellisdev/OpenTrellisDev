import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"
import { db } from "@/lib/db"

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async session({ session, token, user }) {
      // Properly populate all session user fields from token
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.username = token.username
        session.user.userType = token.userType || 'FREE'
        session.user.role = token.role || 'USER'
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      // First, fetch and populate user data from database
      let dbUser = null
      if (token.email) {
        dbUser = await db.user.findFirst({
          where: { email: token.email },
        })
      }
      
      if (!dbUser && user) {
        token.id = user.id
        token.userType = user.userType || 'FREE'
        token.role = user.role || 'USER'
      } else if (dbUser) {
        token.id = dbUser.id
        token.name = dbUser.name
        token.email = dbUser.email
        token.picture = dbUser.image
        token.username = dbUser.username
        token.userType = dbUser.userType || 'FREE'
        token.role = dbUser.role || 'USER'
      }
      
      // Then handle auto-subscription for new sign-ins
      if (user && trigger === 'signIn') {
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
      
      return token
    },
  },
})

export { handler as GET, handler as POST }