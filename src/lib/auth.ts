import { db } from '@/lib/db'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
// import { nanoid } from 'nanoid' // Unused import
import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // This runs every time a user signs in (including first time)
      try {
        if (user.id && user.email) {
          // console.log('SignIn callback triggered for:', user.email)
          
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
              // console.log('Auto-subscribed user to OpenTrellis via signIn callback:', user.email)
            } else {
              // console.log('User already subscribed to OpenTrellis:', user.email)
            }
          }
        }
      } catch (error) {
        // console.error('Error in signIn callback auto-subscription:', error)
      }
      
      return true // Always allow sign in
    },
    async session({ token, session }) {
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
    async jwt({ token, user }) {
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
        return token
      }
      if (dbUser) {
        token.id = dbUser.id
        token.name = dbUser.name
        token.email = dbUser.email
        token.picture = dbUser.image
        token.username = dbUser.username
        token.userType = dbUser.userType || 'FREE'
        token.role = dbUser.role || 'USER'
      }
      return token
    },
    redirect() {
      return '/'
    },
  },
}

export const getAuthSession = () => getServerSession(authOptions)
