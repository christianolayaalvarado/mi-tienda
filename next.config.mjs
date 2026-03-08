/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Permite usar imágenes locales sin problemas
    unoptimized: true,
  },
};

export default nextConfig;