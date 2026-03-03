/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Content Security Policy cho phép nhúng (frame-ancestors *)
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
        ],
      },
    ]
  },
};

export default nextConfig;
