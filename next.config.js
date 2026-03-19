/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use relative path going up 6 levels to C:\ to escape OneDrive (avoids EBUSY locking)
  distDir: '../../../../../../temp_appmeeting/dot-next',
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
}

module.exports = nextConfig
