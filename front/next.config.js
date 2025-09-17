/** @type {import('next').NextConfig} */
const prodHost = process.env.NEXT_PUBLIC_MEDIA_HOST
const nextConfig = {
  images: {
    remotePatterns: [
      // dev
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/**' },
      // prod (через env)
      ...(prodHost
        ? [{ protocol: 'https', hostname: prodHost, pathname: '/**' }]
        : []),
    ],
  },
}

module.exports = nextConfig


