/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Font optimization is handled by Next.js automatically
  // Set turbopack root to prevent workspace root warnings
  turbopack: {
    root: process.cwd(),
  },
}

module.exports = nextConfig


