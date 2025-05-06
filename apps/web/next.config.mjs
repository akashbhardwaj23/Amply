/** @type {import('next').NextConfig} */

import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
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
}

//Remove This
console.log(process.env.CIVIC_AUTH_CLIENT_ID)

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.CIVIC_AUTH_CLIENT_ID,
  enableSolanaWalletAdapter: true, 
  loginUrl : "/login"
});

export default withCivicAuth(nextConfig);
