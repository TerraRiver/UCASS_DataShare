/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  // 增加请求体大小限制，支持大文件上传（5GB）
  experimental: {
    // 禁用API路由的body size限制警告
    serverActions: {
      bodySizeLimit: '5gb',
    },
  },
  // API路由配置
  api: {
    bodyParser: {
      sizeLimit: '5gb',
    },
    responseLimit: false,
  },
};

module.exports = nextConfig; 