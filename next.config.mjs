/** @type {import('next').NextConfig} */
const nextConfig = {
  // RAG indexing reads .md files from /content/books at request time via
  // fs — keep this on the Node.js runtime (not Edge) everywhere it's used.
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
