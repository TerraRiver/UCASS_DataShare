/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 在 Docker 部署中，API 请求通过 Nginx 代理
  // 浏览器直接访问 /api/* 会被 Nginx 转发到后端
  // 因此不需要 rewrites 配置
};

module.exports = nextConfig; 