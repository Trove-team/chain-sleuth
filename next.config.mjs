/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@ref-finance/ref-sdk", "near-api-js");
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
      {
        source: "/swagger/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/.well-known/:path*',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/swagger',
        destination: '/api/swagger',
      },
      {
        source: '/swagger/:path*',
        destination: '/api/swagger/:path*',
      },
    ];
  },

  experimental: {
    esmExternals: 'loose'
  },

  env: {
    NEAR_NETWORK: process.env.NEAR_NETWORK,
    NEAR_NODE_URL: process.env.NEAR_NODE_URL,
    NEAR_WALLET_URL: process.env.NEAR_WALLET_URL,
    NEAR_HELPER_URL: process.env.NEAR_HELPER_URL,
    NEAR_CONTRACT_NAME: process.env.NEAR_CONTRACT_NAME,
    DEBUG: process.env.DEBUG,
  },
};

export default nextConfig;
