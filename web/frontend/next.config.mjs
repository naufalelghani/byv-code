const nextConfig = {
  reactStrictMode: true,
  // Proxy API requests to backend (port 5000) during development
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
