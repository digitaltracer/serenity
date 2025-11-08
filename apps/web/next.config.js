/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@serenity/core', '@serenity/ui', '@serenity/database'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Disable image optimization for self-hosted deployment
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
