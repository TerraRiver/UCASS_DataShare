'use client'

import { useEffect, useState, FC, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, CardFooter, Divider, Button } from "@nextui-org/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BookMarkedIcon, ClockIcon, CheckCircleIcon, DownloadCloudIcon, AlertTriangleIcon } from "lucide-react"

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
    datasetsByCategory: [],
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookMarkedIcon} title="数据集总数" value={stats.totalDatasets} color="text-blue-500" />
        <StatCard icon={ClockIcon} title="等待审核" value={stats.pendingDatasets} color="text-yellow-500" />
        <StatCard icon={CheckCircleIcon} title="已审核通过" value={stats.approvedDatasets} color="text-green-500" />
        <StatCard icon={DownloadCloudIcon} title="总下载次数" value={stats.totalDownloads} color="text-indigo-500" />
      </div>

      {/* 可视化图表 */}
      <Card className="shadow-lg">
        <CardHeader>
          <h2 className="text-xl font-semibold">已通过数据集分类统计</h2>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={stats.datasetsByCategory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="数据集数量" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* 待审核区域 */}
        <Card className="shadow-lg">
           <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold">待审核任务</h2>
              </div>
              <Button as={Link} href="/admin/review" color="primary">
                进入审核页面
              </Button>
           </CardHeader>
           <Divider/>
           <CardBody>
              <p>
                当前有 <span className="font-bold text-yellow-600">{stats.pendingDatasets}</span> 个数据集正在等待您的审核。
              </p>
              <p className="text-sm text-gray-500 mt-2">
                请前往专门的审核页面处理这些请求。
              </p>
           </CardBody>
        </Card>

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
                管理平台上的所有数据集，包括查看、编辑、设置可见性或删除。
              </p>
              <p className="text-sm text-gray-500 mt-2">
                共 <span className="font-bold text-blue-600">{stats.totalDatasets}</span> 个数据集。
              </p>
            </CardBody>
        </Card>
      </div>

    </div>
  )
} 