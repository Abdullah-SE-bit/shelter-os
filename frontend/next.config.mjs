/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speeds up dev-mode compilation for routes that pull in these
  // barrel-style packages, by only compiling the specific exports each
  // file actually imports instead of the whole package.
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'radix-ui'],
  },
};

export default nextConfig;
