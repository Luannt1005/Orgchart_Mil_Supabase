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
            // Cho phép nhúng iframe từ mọi nguồn (X-Frame-Options)
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
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
