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
