/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['ui-avatars.com', 'lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;
