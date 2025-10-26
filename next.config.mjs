/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence webpack conflict warning
  // since we're using HTTP API instead of native HyperSync client
  turbopack: {},
}

export default nextConfig
