'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  DownloadIcon,
  LogOutIcon,
  AlertCircleIcon,
  CalendarIcon
} from 'lucide-react'

interface DashboardStats {
  totalDatasets: number
  pendingReview: number
  approvedDatasets: number
  totalDownloads: number
}

interface PendingDataset {
  id: string
  name: string
  catalog: string
  uploadTime: string
  uploadedBy: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingDatasets, setPendingDatasets] = useState<PendingDataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      // 获取待审核数据集
      const pendingResponse = await fetch('/api/admin/datasets/pending', { headers })

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingDatasets(pendingData.datasets || [])
        
        // 模拟统计数据
        setStats({
          totalDatasets: pendingData.datasets?.length || 0,
          pendingReview: pendingData.datasets?.length || 0,
          approvedDatasets: 0,
          totalDownloads: 0
        })
      } else {
        if (pendingResponse.status === 401) {
          localStorage.removeItem('admin_token')
          router.push('/admin/login')
        } else {
          setError('获取数据失败')
        }
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  const handleApprove = async (datasetId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/datasets/${datasetId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          visible: true,
          enableVisualization: false,
          enableAnalysis: false,
        }),
      })

      if (response.ok) {
        // 重新获取数据
        fetchDashboardData()
      } else {
        setError('审核操作失败')
      }
    } catch (error) {
      setError('网络错误')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UD</span>
            </div>
            <h1 className="text-2xl font-bold">UCASS DataShare 管理后台</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              前台首页
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">数据集总数</CardTitle>
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDatasets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">等待审核</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已审核通过</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approvedDatasets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总下载次数</CardTitle>
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClockIcon className="mr-2 h-5 w-5" />
              待审核数据集 ({pendingDatasets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDatasets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无待审核的数据集
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{dataset.name}</h4>
                        <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {dataset.catalog}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        上传时间: {formatDate(dataset.uploadTime)}
                        <span className="mx-2">•</span>
                        上传者: {dataset.uploadedBy}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/datasets/${dataset.id}`}>
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => handleApprove(dataset.id)}>
                        <CheckCircleIcon className="mr-1 h-4 w-4" />
                        通过审核
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 