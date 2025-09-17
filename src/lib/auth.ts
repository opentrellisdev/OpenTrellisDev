import { db } from '@/lib/db'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { nanoid } from 'nanoid'
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
        // New user created - auto-subscribe to OpenTrellis
        console.log('New user detected:', user.id, user.email)
        try {
          const openTrellisSubreddit = await db.subreddit.findUnique({
            where: { name: 'OpenTrellis' }
          })
          
          if (openTrellisSubreddit) {
            // Check if already subscribed to avoid duplicate key error
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
              console.log('Auto-subscribed new user to OpenTrellis:', user.email)
            }
          }
        } catch (error) {
          console.error('Error auto-subscribing new user:', error)
        }
        
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
