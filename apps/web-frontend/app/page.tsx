import Link from 'next/link'
import { Database, BarChart3, Users, Download } from 'lucide-react'

export default function HomePage() {
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
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                登录
              </Link>
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
            探索、分析和分享高质量的社会科学数据集。支持在线预览、数据可视化和深度分析，
            为研究者提供强大的数据工具。
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/datasets"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              <Database className="mr-2 h-5 w-5" />
              浏览数据集
            </Link>
            <Link 
              href="/register"
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              立即注册
            </Link>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">海量数据集</h3>
            <p className="text-gray-600">
              涵盖经济、社会、政治等多个领域的高质量数据集
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">数据可视化</h3>
            <p className="text-gray-600">
              支持多种图表类型，让数据洞察一目了然
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">协作分享</h3>
            <p className="text-gray-600">
              与研究团队无缝协作，分享数据和分析结果
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">便捷下载</h3>
            <p className="text-gray-600">
              支持多种格式的数据下载，满足不同需求
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