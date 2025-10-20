/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deaktiviere Turbopack für Production Build
  experimental: {
    turbo: undefined
  },
  // Erhöhe Timeout
  staticPageGenerationTimeout: 300,
}

module.exports = nextConfig