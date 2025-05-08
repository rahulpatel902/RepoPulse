/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Skip type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Environment variables that will be available at build time
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://repopulse.netlify.app',
    GITHUB_ID: process.env.GITHUB_ID || 'Ov23ligfA8DnJJnelCtg',
    GITHUB_SECRET: process.env.GITHUB_SECRET || '4cfc398eda659423482b675fd408f963be51ca6c',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'Gy8oHg/RwHw/Q/bHbXlQi9K6RZHhEXPpRwUMXkFQwQE='
  },
};

module.exports = nextConfig;
