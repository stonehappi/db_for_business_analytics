/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@db-platform/db', '@db-platform/sandbox'],
  webpack: (config) => {
    config.externals.push({
      pg: 'commonjs pg',
      'pg-native': 'commonjs pg-native',
    });
    return config;
  },
};

export default nextConfig;
