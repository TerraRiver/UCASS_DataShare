'use client'

import { useEffect, useState, FC, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, CardFooter, Divider, Button } from "@nextui-org/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BookMarkedIcon, ClockIcon, CheckCircleIcon, DownloadCloudIcon, AlertTriangleIcon, UsersIcon } from "lucide-react"

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}

// 单个统计卡片组件
const StatCard: FC<StatCardProps> = ({ icon, title, value, color }) => {
  const Icon = icon
  return (
    <Card className="shadow-md">
      <CardHeader className="flex gap-3">
        <Icon className={`w-8 h-8 ${color}`} />
        <div className="flex flex-col">
          <p className="text-md">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardHeader>
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
    return <div className="p-8">加载中...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">错误: {error}</div>
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">管理仪表盘</h1>

      {/* 统计卡片 */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">数据集统计</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={BookMarkedIcon} title="数据集总数" value={stats.totalDatasets} color="text-blue-500" />
            <StatCard icon={ClockIcon} title="待审核" value={stats.pendingDatasets} color="text-yellow-500" />
            <StatCard icon={CheckCircleIcon} title="已审核通过" value={stats.approvedDatasets} color="text-green-500" />
            <StatCard icon={DownloadCloudIcon} title="总下载次数" value={stats.totalDownloads} color="text-indigo-500" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">案例集统计</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={BookMarkedIcon} title="案例集总数" value={stats.totalCaseStudies} color="text-emerald-500" />
            <StatCard icon={ClockIcon} title="待审核" value={stats.pendingCaseStudies} color="text-orange-500" />
            <StatCard icon={CheckCircleIcon} title="已审核通过" value={stats.approvedCaseStudies} color="text-teal-500" />
            <StatCard icon={DownloadCloudIcon} title="总下载次数" value={stats.totalCaseStudyDownloads} color="text-purple-500" />
          </div>
        </div>
      </div>

      {/* 可视化图表 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">数据集分类统计</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.datasetsByCategory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="数据集数量" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">案例集学科统计</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.caseStudiesByDiscipline}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="案例集数量" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 数据集管理区域 */}
        <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <BookMarkedIcon className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold">数据集管理</h2>
              </div>
              <Button as={Link} href="/admin/datasets" color="primary">
                进入管理页面
              </Button>
            </CardHeader>
            <Divider/>
            <CardBody>
              <p>
                管理平台上的所有数据集，包括审核、编辑、设置可见性或删除。
              </p>
              <p className="text-sm text-gray-500 mt-2">
                共 <span className="font-bold text-blue-600">{stats.totalDatasets}</span> 个数据集，
                <span className="font-bold text-yellow-600">{stats.pendingDatasets}</span> 个待审核。
              </p>
            </CardBody>
        </Card>

        {/* 案例集管理区域 */}
        <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <BookMarkedIcon className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold">案例集管理</h2>
              </div>
              <Button as={Link} href="/admin/casestudies" color="primary">
                进入管理页面
              </Button>
            </CardHeader>
            <Divider/>
            <CardBody>
              <p>
                管理论文复现的案例集，包括审核、发布和删除。
              </p>
              <p className="text-sm text-gray-500 mt-2">
                共 <span className="font-bold text-emerald-600">{stats.totalCaseStudies}</span> 个案例集，
                <span className="font-bold text-orange-600">{stats.pendingCaseStudies}</span> 个待审核。
              </p>
            </CardBody>
        </Card>

        {/* 账号管理区域 */}
        <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold">账号管理</h2>
              </div>
              <Button as={Link} href="/admin/accounts" color="primary">
                进入管理页面
              </Button>
            </CardHeader>
            <Divider/>
            <CardBody>
              <p>
                管理和维护管理员账号，包括创建、修改和删除操作。
              </p>
               <p className="text-sm text-gray-500 mt-2">
                请谨慎操作，确保系统安全。
              </p>
            </CardBody>
        </Card>
      </div>

    </div>
  )
} 