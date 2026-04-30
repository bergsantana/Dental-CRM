/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/pacientes",
        destination: "/clients",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
