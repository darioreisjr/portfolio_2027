import type { NextConfig } from 'next';

// Export estático (ADR 0002): sem rewrites, redirects, headers nem proxy.
// trailingSlash gera rota/index.html, que todo host estático resolve sem regra.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
