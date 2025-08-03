/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@etsy-manager/shared'],
  images: {
    domains: ['i.etsystatic.com'],
  },
  eslint: {
    // Skip ESLint during builds - we'll run it separately
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We've already verified TypeScript compilation works
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
