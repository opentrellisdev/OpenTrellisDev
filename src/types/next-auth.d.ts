import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username?: string | null
      userType: 'FREE' | 'PAID' | 'MENTOR'
      role: 'USER' | 'ADMIN' | 'MODERATOR'
    } & DefaultSession['user']
  }
  interface User extends DefaultUser {
    id: string
    username?: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
    role: 'USER' | 'ADMIN' | 'MODERATOR'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username?: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
    role: 'USER' | 'ADMIN' | 'MODERATOR'
  }
}
