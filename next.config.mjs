/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@next-auth/prisma-adapter"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "6h9f7lxba9.ufs.sh",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules[/\\]next-auth/,
        type: "javascript/auto",
        resolve: {
          mainFields: ["module", "main"],
        },
      });
    }
    return config;
  },
};

export default nextConfig;
