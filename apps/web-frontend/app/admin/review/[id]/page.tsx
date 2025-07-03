'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  CalendarIcon,
  FileIcon,
  UserIcon,
  AlertCircleIcon,
  EyeIcon,
  BarChart3Icon
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
}

export default function AdminReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 审核设置
  const [visible, setVisible] = useState(true)
  const [enableVisualization, setEnableVisualization] = useState(false)
  const [enableAnalysis, setEnableAnalysis] = useState(false)

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    if (params.id) {
      fetchDataset(params.id as string)
    }
  }, [params.id, router])

  const fetchDataset = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/datasets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDataset(data.dataset)
        
        // 设置默认值
        setVisible(data.dataset.isVisible)
        setEnableVisualization(data.dataset.enableVisualization)
        setEnableAnalysis(data.dataset.enableAnalysis)
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        setError('获取数据集详情失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!dataset) return

    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/datasets/${dataset.id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          visible,
          enableVisualization,
          enableAnalysis,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        router.push('/admin/dashboard')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '审核操作失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <h1 className="text-2xl font-bold">数据集审核</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            状态: {dataset?.isReviewed ? '已审核' : '待审核'}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dataset Information */}
          {dataset && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderIcon className="mr-2 h-5 w-5" />
                  数据集信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{dataset.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                      <span className="bg-secondary px-2 py-1 rounded">{dataset.catalog}</span>
                      <span>{dataset.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(dataset.fileSize)}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">上传时间</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(dataset.uploadTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">上传者</div>
                        <div className="text-sm text-muted-foreground">
                          {dataset.uploadedBy}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">描述</h4>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {dataset.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Settings */}
          {dataset && !dataset.isReviewed && (
            <Card>
              <CardHeader>
                <CardTitle>审核设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={visible}
                      onChange={(e) => setVisible(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="visible">审核通过后立即公开显示</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visualization"
                      checked={enableVisualization}
                      onChange={(e) => setEnableVisualization(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="visualization" className="flex items-center">
                      <EyeIcon className="mr-1 h-4 w-4" />
                      启用数据可视化功能
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="analysis"
                      checked={enableAnalysis}
                      onChange={(e) => setEnableAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="analysis" className="flex items-center">
                      <BarChart3Icon className="mr-1 h-4 w-4" />
                      启用数据分析功能
                    </Label>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={() => handleReview('approve')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    {submitting ? '处理中...' : '通过审核'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('reject')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    {submitting ? '处理中...' : '拒绝审核'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed */}
          {dataset && dataset.isReviewed && (
            <Card>
              <CardHeader>
                <CardTitle>审核结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>该数据集已通过审核</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">可见性:</span>
                    <span className={`text-sm ${dataset.isVisible ? 'text-green-600' : 'text-gray-600'}`}>
                      {dataset.isVisible ? '公开' : '隐藏'}
                    </span>
                  </div>
                  {dataset.enableVisualization && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <EyeIcon className="h-4 w-4" />
                      <span>已启用可视化功能</span>
                    </div>
                  )}
                  {dataset.enableAnalysis && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <BarChart3Icon className="h-4 w-4" />
                      <span>已启用分析功能</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Link href={`/datasets/${dataset?.id}`}>
                  <Button variant="outline">
                    查看详情页
                  </Button>
                </Link>
                <Link href="/admin/datasets">
                  <Button variant="outline">
                    管理所有数据集
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}