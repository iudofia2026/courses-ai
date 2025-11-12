/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.coursetable.com',
      },
    ],
  },
}

module.exports = nextConfig