#!/bin/bash

# Clean up existing installations
rm -rf node_modules
rm package-lock.json

# Core dependencies
npm install --save --legacy-peer-deps \
@solana/web3.js \
@solana/wallet-adapter-base \
@solana/wallet-adapter-react \
@solana/wallet-adapter-react-ui \
@solana/wallet-adapter-wallets \
bs58 \
bn.js

# Wallet adapters
npm install --save --legacy-peer-deps \
@solana/wallet-adapter-phantom \
@solana/wallet-adapter-solflare \
@solana/wallet-adapter-backpack \
@solana/wallet-adapter-glow \
@solana/wallet-adapter-slope \
@solana/wallet-adapter-trust

# Development dependencies
npm install --save-dev --legacy-peer-deps \
@types/bn.js \
@solana/spl-token

# Additional utilities
npm install --save --legacy-peer-deps \
buffer \
crypto-browserify \
process \
stream-browserify

# Update package.json browser field
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.browser = {
  'crypto': 'crypto-browserify',
  'stream': 'stream-browserify',
  'buffer': 'buffer'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "Installation complete! Now updating next.config.js..."

# Update next.config.js to include webpack configuration
cat > next.config.js << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
}

module.exports = nextConfig
EOL

echo "Setup complete!"