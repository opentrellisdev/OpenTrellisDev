import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

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
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType || 'FREE'
      }
      return token
    },
  },
})

export { handler as GET, handler as POST }