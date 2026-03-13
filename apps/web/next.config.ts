import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@scrumbs/db', '@scrumbs/types', '@scrumbs/personas'],
}

export default nextConfig
