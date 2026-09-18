/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional rewrite for local development API proxying if needed
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
