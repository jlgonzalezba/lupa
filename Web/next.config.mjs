/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // turbo: false, // removed - not valid in Next.js 16
  },
}

export default nextConfig
