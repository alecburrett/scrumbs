import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@scrumbs/db', '@scrumbs/types'],
}

export default nextConfig
