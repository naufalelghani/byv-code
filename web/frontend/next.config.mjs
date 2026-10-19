// TODO(human): Verify proxy behavior for all endpoints
// /api/auth/status   -> backend /api/auth/status (GET)
// /api/models        -> backend /api/models (GET)
// /api/chat          -> backend /api/chat (POST, SSE stream)
// /api/search        -> backend /api/search (POST)
// /api/mcp/servers   -> backend /api/mcp/servers (GET, POST, DELETE)
// Ensure trailingSlash:false so /api/chat matches, not /api/chat/

import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Explicitly set project root to this directory (frontend)
  // so Next.js doesn't pick up parent lockfiles and misresolve @/* aliases
  outputFileTracingRoot: __dirname,
  turbopack: {
    resolveAlias: {
      // Explicit path alias resolution — tsconfig paths alone aren't
      // sufficient when multiple lockfiles exist in the tree
      '@/components': './app/components',
      '@/hooks': './app/hooks',
      '@/articles': './app/articles',
      '@/search': './app/search',
      '@/settings': './app/settings',
    },
  },
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
