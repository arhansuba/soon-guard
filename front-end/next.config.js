// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static export
  output: 'standalone',
  // Configure image domains if needed
  images: {
    domains: ['api.placeholder.com'],
    unoptimized: true,
  },
  // Add redirects for SPA-like behavior
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
  // Environment variables that need to be exposed to the browser
  env: {
    NEXT_PUBLIC_RPC_URL: 'https://rpc.devnet.soo.network/rpc',
  }
};

module.exports = nextConfig;