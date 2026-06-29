/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  async redirects() {
    return [
      {
        source: "/ciqual2/aliment/:path*",
        destination: "/base/aliment/:path*",
        permanent: false
      },
      {
        source: "/ciqual2",
        destination: "/base",
        permanent: false
      },
      {
        source: "/search",
        destination: "/base",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
