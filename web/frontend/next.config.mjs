import type { NextConfig } from 'next'

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // TODO(human): Verify proxy behavior for all endpoints
  // /api/auth/status   -> backend /api/auth/status (GET)
  // /api/models        -> backend /api/models (GET)
  // /api/chat          -> backend /api/chat (POST, SSE stream)
  // /api/search        -> backend /api/search (POST)
  // /api/mcp/servers   -> backend /api/mcp/servers (GET, POST, DELETE)
  // Ensure trailingSlash:false so /api/chat matches, not /api/chat/
  trailingSlash: false,
  // TypeScript path aliases — @/* maps to ./app/*
  // tsconfig.json handles this for types; Next.js handles at runtime
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
        },
      ]
    }
    return []
  },
}

export default nextConfig
