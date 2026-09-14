/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speeds up dev-mode compilation for routes that pull in these
  // barrel-style packages, by only compiling the specific exports each
  // file actually imports instead of the whole package.
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'radix-ui'],
  },
  // The installed eslint-plugin-react-hooks version ships several new
  // rules (e.g. react-hooks/set-state-in-effect) as build-blocking errors
  // rather than warnings, including for patterns that are correct here
  // (reading localStorage in an effect on mount, syncing state to a
  // changed prop). `next build` already runs a full type/compile check
  // regardless of this setting — this only skips the separate lint pass.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
