'use client'

import { useEffect, useState, FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Divider, Button } from "@nextui-org/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BookMarkedIcon, ClockIcon, CheckCircleIcon, DownloadCloudIcon, TrendingUpIcon, FileTextIcon, ArrowRightIcon, LinkIcon } from "lucide-react"

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  bgColor: string;
}

// 改进的统计卡片组件
const StatCard: FC<StatCardProps> = ({ icon, title, value, subtitle, color, bgColor }) => {
  const Icon = icon
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDatasets: 0,
    pendingDatasets: 0,
    approvedDatasets: 0,
    totalDownloads: 0,
    totalCaseStudies: 0,
    pendingCaseStudies: 0,
    approvedCaseStudies: 0,
    totalCaseStudyDownloads: 0,
    datasetsByCategory: [],
    caseStudiesByDiscipline: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('admin_token')
            router.push('/admin/login')
            return
          }
          throw new Error('获取统计数据失败')
        }
        const data = await response.json()
        setStats(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">错误: {error}</p>
        </div>
      </div>
    )
  }

  const totalResources = stats.totalDatasets + stats.totalCaseStudies
  const totalDownloadsAll = stats.totalDownloads + stats.totalCaseStudyDownloads
  const totalPending = stats.pendingDatasets + stats.pendingCaseStudies

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-6">
        <h1
          className="text-4xl font-light text-gray-900"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          管理仪表盘
        </h1>
        <p className="text-gray-600 mt-2">平台数据概览与管理入口</p>
      </div>

      {/* 管理入口 - 移到最上方 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 数据集管理区域 */}
        <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-red-200">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <BookMarkedIcon className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                  >
                    数据集管理
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">管理所有数据集资源</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/admin/datasets"
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                进入管理
              </Button>
            </div>
          </CardHeader>
          <Divider/>
          <CardBody className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">总数:</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalDatasets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">待审核:</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats.pendingDatasets}</span>
                </div>
              </div>
              <div className="h-16 w-px bg-gray-200"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">主要功能</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• 内容审核</div>
                  <div>• 编辑管理</div>
                  <div>• 可见性设置</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 案例集管理区域 */}
        <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-red-200">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <BookMarkedIcon className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                  >
                    案例集管理
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">管理论文复现资源包</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/admin/casestudies"
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                进入管理
              </Button>
            </div>
          </CardHeader>
          <Divider/>
          <CardBody className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">总数:</span>
                  <span className="text-2xl font-bold text-emerald-600">{stats.totalCaseStudies}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">待审核:</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.pendingCaseStudies}</span>
                </div>
              </div>
              <div className="h-16 w-px bg-gray-200"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">主要功能</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• 案例审核</div>
                  <div>• 发布管理</div>
                  <div>• 特性设置</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 关系管理区域 */}
        <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-red-200">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <LinkIcon className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                  >
                    关系管理
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">管理案例集与数据集关联</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/admin/relationships"
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                进入管理
              </Button>
            </div>
          </CardHeader>
          <Divider/>
          <CardBody className="p-6">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>为案例集关联相关数据集</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>构建知识图谱网络</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>支持可视化探索</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 总体统计卡片 */}
      <div>
        <h2
          className="text-2xl font-light text-gray-900 mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          平台总览
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileTextIcon}
            title="资源总数"
            value={totalResources}
            subtitle="数据集与案例集"
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            icon={ClockIcon}
            title="待审核"
            value={totalPending}
            subtitle="需要处理的内容"
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            icon={CheckCircleIcon}
            title="已审核通过"
            value={stats.approvedDatasets + stats.approvedCaseStudies}
            subtitle="可公开访问"
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={TrendingUpIcon}
            title="总下载次数"
            value={totalDownloadsAll}
            subtitle="用户下载统计"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
        </div>
      </div>

      {/* 数据集统计 */}
      <div>
        <h2
          className="text-2xl font-light text-gray-900 mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          数据集统计
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookMarkedIcon}
            title="数据集总数"
            value={stats.totalDatasets}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={ClockIcon}
            title="待审核"
            value={stats.pendingDatasets}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard
            icon={CheckCircleIcon}
            title="已审核通过"
            value={stats.approvedDatasets}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={DownloadCloudIcon}
            title="总下载次数"
            value={stats.totalDownloads}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>
      </div>

      {/* 案例集统计 */}
      <div>
        <h2
          className="text-2xl font-light text-gray-900 mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          案例集统计
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookMarkedIcon}
            title="案例集总数"
            value={stats.totalCaseStudies}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            icon={ClockIcon}
            title="待审核"
            value={stats.pendingCaseStudies}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={CheckCircleIcon}
            title="已审核通过"
            value={stats.approvedCaseStudies}
            color="text-teal-600"
            bgColor="bg-teal-50"
          />
          <StatCard
            icon={DownloadCloudIcon}
            title="总下载次数"
            value={stats.totalCaseStudyDownloads}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      </div>

      {/* 数据集分类分布 - 单独一行 */}
      <div>
        <h2
          className="text-2xl font-light text-gray-900 mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          数据集分类分布
        </h2>
        <Card className="shadow-lg">
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={stats.datasetsByCategory}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#ef4444"
                  name="数据集数量"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* 案例集学科分布 - 单独一行 */}
      <div>
        <h2
          className="text-2xl font-light text-gray-900 mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          案例集学科分布
        </h2>
        <Card className="shadow-lg">
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={stats.caseStudiesByDiscipline}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  name="案例集数量"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
