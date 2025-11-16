export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
    databaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  }

  return new Response(JSON.stringify(checks, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}

