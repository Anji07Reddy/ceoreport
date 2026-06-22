/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx and other libs can use node APIs; keep them external on the server
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
