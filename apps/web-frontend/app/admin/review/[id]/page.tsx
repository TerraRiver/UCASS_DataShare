'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@nextui-org/react'
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
  BarChart3Icon,
  StarIcon,
  DownloadIcon
} from 'lucide-react'

interface Dataset {
  id: string
  name: string
  catalog: string
  summary?: string
  description: string
  fileType: string
  fileSize: number
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  isFeatured: boolean
  enableVisualization: boolean
  enableAnalysis: boolean
  enablePreview: boolean
}

export default function AdminReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  // 审核/状态设置
  const [isVisible, setIsVisible] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [enableVisualization, setEnableVisualization] = useState(false)
  const [enableAnalysis, setEnableAnalysis] = useState(false)
  const [enablePreview, setEnablePreview] = useState(false)

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
      const response = await fetch(`/api/admin/datasets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDataset(data.dataset)
        
        // 设置默认值
        setIsVisible(data.dataset.isVisible)
        setIsFeatured(data.dataset.isFeatured)
        setEnableVisualization(data.dataset.enableVisualization)
        setEnableAnalysis(data.dataset.enableAnalysis)
        setEnablePreview(data.dataset.enablePreview)
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

  const handleUpdateStatus = async (statusUpdate: Partial<Dataset>) => {
    if (!dataset) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/datasets/${dataset.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });

      if (response.ok) {
        // Optimistically update local state or refetch
        setDataset(prev => prev ? { ...prev, ...statusUpdate } : null);
        if (statusUpdate.isVisible !== undefined) setIsVisible(statusUpdate.isVisible);
        if (statusUpdate.isFeatured !== undefined) setIsFeatured(statusUpdate.isFeatured);
        if (statusUpdate.enableVisualization !== undefined) setEnableVisualization(statusUpdate.enableVisualization);
        if (statusUpdate.enableAnalysis !== undefined) setEnableAnalysis(statusUpdate.enableAnalysis);
        if (statusUpdate.enablePreview !== undefined) setEnablePreview(statusUpdate.enablePreview);

        // If this was an approval, also update the reviewed status
        if (statusUpdate.isReviewed) {
           setDataset(prev => prev ? { ...prev, isReviewed: true } : null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '状态更新失败');
      }
    } catch (error) {
      setError('网络错误，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!dataset) return

    setSubmitting(true)
    setError('')

    if (action === 'approve') {
      // Approve and set all other statuses in one go
      await handleUpdateStatus({
        isReviewed: true,
        isVisible,
        isFeatured,
        enableVisualization,
        enableAnalysis,
        enablePreview,
      });
      alert('数据集审核通过');
      router.push('/admin/dashboard');
      return;
    }

    // Handle rejection separately as it's a destructive action
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/datasets/${dataset.id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
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

  const handleDownload = async () => {
    if (!dataset) return

    setDownloading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/datasets/${dataset.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dataset.name}${dataset.fileType}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '下载失败')
      }
    } catch (error) {
      setError('下载失败，请稍后再试')
    } finally {
      setDownloading(false)
    }
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
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mb-3" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-semibold text-foreground mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-medium text-foreground mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="ml-4" {...props} />,
                          code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded-md overflow-x-auto mb-2" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-muted-foreground pl-2 italic mb-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                        }}
                      >
                        {dataset.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          {dataset && (
            <Card>
              <CardHeader>
                <CardTitle>状态管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVisible" className="flex items-center space-x-2">
                      <EyeIcon className="h-4 w-4" />
                      <span>公开可见</span>
                    </Label>
                    <Switch
                      id="isVisible"
                      isSelected={isVisible}
                      onValueChange={(val) => {
                        setIsVisible(val);
                        if(dataset.isReviewed) handleUpdateStatus({ isVisible: val });
                      }}
                      color="primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured" className="flex items-center space-x-2">
                      <StarIcon className="h-4 w-4" />
                      <span>设为精选</span>
                    </Label>
                    <Switch
                      id="isFeatured"
                      isSelected={isFeatured}
                      onValueChange={(val) => {
                        setIsFeatured(val);
                        if(dataset.isReviewed) handleUpdateStatus({ isFeatured: val });
                      }}
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableVisualization" className="flex items-center space-x-2">
                      <BarChart3Icon className="h-4 w-4" />
                      <span>启用可视化</span>
                    </Label>
                    <Switch
                      id="enableVisualization"
                      isSelected={enableVisualization}
                      onValueChange={(val) => {
                        setEnableVisualization(val);
                        if(dataset.isReviewed) handleUpdateStatus({ enableVisualization: val });
                      }}
                      color="primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAnalysis" className="flex items-center space-x-2">
                      <BarChart3Icon className="h-4 w-4" />
                      <span>启用数据分析</span>
                    </Label>
                    <Switch
                      id="enableAnalysis"
                      isSelected={enableAnalysis}
                      onValueChange={(val: boolean) => {
                        setEnableAnalysis(val);
                        if(dataset.isReviewed) handleUpdateStatus({ enableAnalysis: val });
                      }}
                      color="primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enablePreview" className="flex items-center space-x-2">
                      <EyeIcon className="h-4 w-4" />
                      <span>启用数据预览</span>
                    </Label>
                    <Switch
                      id="enablePreview"
                      isSelected={enablePreview}
                      onValueChange={(val: boolean) => {
                        setEnablePreview(val);
                        if(dataset.isReviewed) handleUpdateStatus({ enablePreview: val });
                      }}
                      color="primary"
                    />
                  </div>
                </div>

                {/* Show review buttons only if not yet reviewed */}
                {!dataset.isReviewed && (
                  <>
                    <hr className="border-border my-4" />
                    <div className="flex justify-end space-x-4">
                      <Button 
                        onClick={handleDownload} 
                        disabled={downloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        {downloading ? '下载中...' : '下载数据集'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleReview('reject')} 
                        disabled={submitting}
                      >
                        <XCircleIcon className="mr-2 h-4 w-4" />
                        {submitting ? '处理中...' : '拒绝并删除'}
                      </Button>
                      <Button 
                        onClick={() => handleReview('approve')} 
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="mr-2 h-4 w-4" />
                        {submitting ? '处理中...' : '批准数据集'}
                      </Button>
                    </div>
                  </>
                )}
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
                  {dataset.enablePreview && (
                    <div className="flex items-center space-x-2 text-sm text-purple-600">
                      <EyeIcon className="h-4 w-4" />
                      <span>已启用数据预览</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  )
}