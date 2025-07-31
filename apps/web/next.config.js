/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@etsy-manager/shared'],
  images: {
    domains: ['i.etsystatic.com'],
  },
};

module.exports = nextConfig;
