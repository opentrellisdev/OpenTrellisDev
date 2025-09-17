import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Session {
    user: {
      id: string
      username?: string | null
      userType: 'FREE' | 'PAID' | 'MENTOR'
      role: 'USER' | 'ADMIN' | 'MODERATOR'
    } & DefaultSession['user']
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface User extends DefaultUser {
    id: string
    username?: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
    role: 'USER' | 'ADMIN' | 'MODERATOR'
  }
}

declare module 'next-auth/jwt' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface JWT {
    id: string
    username?: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
    role: 'USER' | 'ADMIN' | 'MODERATOR'
  }
}
