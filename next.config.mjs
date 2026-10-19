/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app does not use next/image. Turning the optimizer off removes the /_next/image endpoint
  // (it answers 404), which closes the attack surface of the Next.js image-optimizer DoS advisory.
  images: { unoptimized: true },
  // RAG indexing reads .md files from /content/books at request time via
  // fs — keep this on the Node.js runtime (not Edge) everywhere it's used.
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
