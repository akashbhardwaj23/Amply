/** @type {import('next').NextConfig} */

const clientId = process.env.CIVIC_AUTH_CLIENT_ID;

if (!clientId) {
  throw new Error('CIVIC_AUTH_CLIENT_ID environment variable is required');
}

import { createCivicAuthPlugin } from '@civic/auth-web3/nextjs';
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

//Remove This
// console.log(process.env.CIVIC_AUTH_CLIENT_ID)

const withCivicAuth = createCivicAuthPlugin({
  clientId,
  enableSolanaWalletAdapter: true,
  loginUrl: '/login',
});

export default withCivicAuth(nextConfig);
