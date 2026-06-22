/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet v4 + React 18 Strict Mode double-invoke mounts the Leaflet map
  // twice on the same DOM node in dev, throwing "Map container is already
  // initialized". Strict Mode's double-mount is dev-only, so disabling it makes
  // dev match production (single mount) and fixes the map. See react-leaflet#936.
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep the MongoDB driver (and its optional native deps) out of the client
  // bundle; it runs in the Node runtime inside route handlers.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
