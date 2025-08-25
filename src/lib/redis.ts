import { Redis } from '@upstash/redis'

// Convert redis:// URL to https:// URL for Upstash
const getRedisUrl = () => {
  const url = process.env.REDIS_URL!
  if (url.startsWith('redis://')) {
    // Convert redis://default:password@host:port to https://host:port
    const match = url.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/)
    if (match) {
      const [, , , host, port] = match
      return `https://${host}:${port}`
    }
  }
  return url
}

export const redis = new Redis({
  url: getRedisUrl(),
  token: process.env.REDIS_SECRET!,
})
