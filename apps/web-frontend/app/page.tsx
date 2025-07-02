'use client'

import Link from 'next/link'
import { Database, BarChart3, Users, Download } from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'
import { AdminOnly, AuthIndicator } from '../components/auth/ProtectedRoute'

export default function HomePage() {
  const { generateAnonymousId } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">UCASS DataShare</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/datasets" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                数据集
              </Link>
              
              <AdminOnly>
                <Link 
                  href="/admin" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  管理面板
                </Link>
              </AdminOnly>
              
              <AdminOnly 
                fallback={
                  <Link 
                    href="/admin/login" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    管理员登录
                  </Link>
                }
              >
                <AuthIndicator />
              </AdminOnly>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container py-16">
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            社科大数据分享平台
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            开放式数据分享平台，支持匿名上传。无需注册即可上传和查看数据，
            管理员轻量认证管理，为研究者提供便捷的数据工具。
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/datasets"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              <Database className="mr-2 h-5 w-5" />
              浏览数据集
            </Link>
            <button
              onClick={generateAnonymousId}
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              开始使用
            </button>
          </div>
        </div>

        {/* 管理员状态显示 */}
        <AdminOnly>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-900">管理员认证已激活</h3>
                <p className="text-blue-700">您已成功登录管理员账户，可以访问平台管理功能。</p>
              </div>
              <div className="ml-auto">
                <Link
                  href="/admin"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  管理面板
                </Link>
              </div>
            </div>
          </div>
        </AdminOnly>

        {/* 功能特性 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">匿名数据上传</h3>
            <p className="text-gray-600">
              无需注册即可上传数据，支持多种格式，保护用户隐私
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">即时数据预览</h3>
            <p className="text-gray-600">
              实时预览数据内容，快速了解数据结构和特征
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">开放式协作</h3>
            <p className="text-gray-600">
              所有人都可以查看和使用数据，促进开放式研究协作
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">轻量管理</h3>
            <p className="text-gray-600">
              管理员轻量认证，确保平台安全运行和数据质量
            </p>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">平台数据概览</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1,200+</div>
              <div className="text-gray-600">数据集</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">注册用户</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50TB+</div>
              <div className="text-gray-600">数据容量</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">用户满意度</div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-6 w-6" />
                <span className="text-lg font-semibold">UCASS DataShare</span>
              </div>
              <p className="text-gray-400">
                中国社会科学院大学数据分享平台，为社会科学研究提供数据支持。
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/datasets" className="hover:text-white transition-colors">数据集浏览</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">用户登录</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">注册账户</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-gray-400">
                <li>邮箱: support@ucass.edu.cn</li>
                <li>电话: (010) 8519-5000</li>
                <li>地址: 北京市房山区长于大街11号</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 中国社会科学院大学. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 