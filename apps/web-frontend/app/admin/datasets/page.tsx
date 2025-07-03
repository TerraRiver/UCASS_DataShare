'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeftIcon,
  SearchIcon,
  FolderIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  SettingsIcon
} from 'lucide-react'

interface Dataset {
  id: string
  name: string
  catalog: string
  description: string
  fileType: string
  fileSize: number
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  enableVisualization: boolean
  enableAnalysis: boolean
  downloadCount: number
}

export default function AdminDatasetsPage() {
  const router = useRouter()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchDatasets()
  }, [router, searchTerm, statusFilter])

  const fetchDatasets = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/datasets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDatasets(data.datasets || [])
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        setError('获取数据集列表失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (datasetId: string) => {
    if (!confirm('确定要删除这个数据集吗？此操作不可撤销。')) {
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchDatasets() // 重新加载列表
      } else {
        setError('删除失败')
      }
    } catch (error) {
      setError('网络错误')
    }
  }

  const toggleVisibility = async (datasetId: string, currentVisibility: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/datasets/${datasetId}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visible: !currentVisibility }),
      })

      if (response.ok) {
        fetchDatasets() // 重新加载列表
      } else {
        setError('更新可见性失败')
      }
    } catch (error) {
      setError('网络错误')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusBadge = (dataset: Dataset) => {
    if (!dataset.isReviewed) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">待审核</span>
    }
    if (dataset.isVisible) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">已发布</span>
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">已隐藏</span>
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
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回仪表板
            </Link>
            <h1 className="text-2xl font-bold">数据集管理</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索数据集..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">所有状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="hidden">已隐藏</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dataset List */}
        <Card>
          <CardHeader>
            <CardTitle>数据集列表 ({datasets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {datasets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                没有找到数据集
              </div>
            ) : (
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FolderIcon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">{dataset.name}</h3>
                        {getStatusBadge(dataset)}
                        <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {dataset.catalog}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {dataset.description}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {formatDate(dataset.uploadTime)}
                        </div>
                        <span>大小: {formatFileSize(dataset.fileSize)}</span>
                        <span>下载: {dataset.downloadCount} 次</span>
                        <span>上传者: {dataset.uploadedBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/datasets/${dataset.id}`}>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      {dataset.isReviewed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVisibility(dataset.id, dataset.isVisible)}
                        >
                          {dataset.isVisible ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {!dataset.isReviewed && (
                        <Link href={`/admin/review/${dataset.id}`}>
                          <Button size="sm">
                            <CheckCircleIcon className="mr-1 h-4 w-4" />
                            审核
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(dataset.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
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