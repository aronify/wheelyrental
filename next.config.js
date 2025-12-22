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
  // Note: Server Actions body size limit is handled automatically in Next.js 16.
  // The deprecated serverActions key has been removed as it's not recognized.
  // Set turbopack root to prevent workspace root warnings
  turbopack: {
    root: process.cwd(),
  },
}

module.exports = nextConfig


