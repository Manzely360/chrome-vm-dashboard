/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/vms',
        destination: 'https://chrome-vm-hosting-production.up.railway.app/api/vms',
      },
      {
        source: '/api/servers',
        destination: 'https://chrome-vm-hosting-production.up.railway.app/api/servers',
      },
      {
        source: '/api/health',
        destination: 'https://chrome-vm-hosting-production.up.railway.app/health',
      },
      {
        source: '/api/run',
        destination: 'https://chrome-vm-hosting-production.up.railway.app/run',
      },
      {
        source: '/api/browser/:path*',
        destination: 'https://chrome-vm-hosting-production.up.railway.app/browser/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
