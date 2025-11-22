import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  redirects() {
    return [
      {
        source: "/:locale/components/:path*",
        destination: "/:locale/docs/components/:path*",
        permanent: true,
      },
    ]
  },
  /* redirects() {
    return [
      {
          // Usar la sintaxis (en|es) asegura que solo se redirija
          // si el primer segmento es 'en' o 'es'.
          source: "/:lang(en|es)/components",
          destination: "/:lang/docs/components",
          permanent: true,
      },
      {
        source: "/docs/:path*.mdx",
        destination: "/es/docs/:path*.md",
        permanent: true,
      }
    ]
  },
  */
  rewrites() {
    return [
      {
        source: "/:lang/docs/:path*.md",
        destination: "/:lang/llm/:path",
      },
    ]
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
