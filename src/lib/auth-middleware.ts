import { getAuthSession } from '@/lib/auth'

type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(requiredRole: UserRole) {
  const session = await requireAuth()
  
  if (session.user.role !== requiredRole) {
    throw new Error('Insufficient permissions')
  }
  
  return session
}

export async function requireAdmin() {
  return requireRole('ADMIN')
}

export async function requireModerator() {
  return requireRole('MODERATOR')
} 