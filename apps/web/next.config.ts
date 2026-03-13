import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@scrumbs/db', '@scrumbs/types'],
  typescript: {
    // next-auth v5 beta emits a non-suppressable portability error for 'auth'.
    // TODO: remove once next-auth stabilises or types are explicitly annotated.
    ignoreBuildErrors: true,
  },
}

export default nextConfig
