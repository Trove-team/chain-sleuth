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
    ];
  },

  experimental: {
    esmExternals: 'loose',
    outputFileTracingExcludes: {
      '*': [
        'near-contract/**/*'
      ],
    },
    serverActions: true,
  }
};

export default nextConfig;
