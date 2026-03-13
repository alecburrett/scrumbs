import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@scrumbs/db', '@scrumbs/types', '@scrumbs/personas'],
}

export default nextConfig
