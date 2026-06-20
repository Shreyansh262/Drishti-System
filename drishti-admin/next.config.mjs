/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep the MongoDB driver (and its optional native deps) out of the bundle;
  // it runs in the Node runtime inside route handlers.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
