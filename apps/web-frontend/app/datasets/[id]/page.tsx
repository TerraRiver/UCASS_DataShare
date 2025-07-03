'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  CalendarIcon, 
  FolderIcon, 
  FileIcon,
  EyeIcon,
  BarChart3Icon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react'

interface Dataset {
  id: string
  name: string
  catalog: string
  description: string
  fileType: string
  fileSize: number
  uploadTime: string
  downloadCount: number
  enableVisualization: boolean
  enableAnalysis: boolean
  isReviewed: boolean
  isVisible: boolean
}

export default function DatasetDetailPage() {
  const params = useParams()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDataset(params.id as string)
    }
  }, [params.id])

  const fetchDataset = async (id: string) => {
    try {
      const response = await fetch(`/api/datasets/${id}`)
      const data = await response.json()

      if (response.ok) {
        setDataset(data.dataset)
      } else {
        setError(data.error || '获取数据集详情失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!dataset) return

    setDownloading(true)
    try {
      const response = await fetch(`/api/datasets/${dataset.id}/download`)
      
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

        // 刷新页面数据以更新下载次数
        fetchDataset(dataset.id)
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6 flex items-center">
            <Link href="/discover" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回数据发现
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6 flex items-center">
            <Link href="/discover" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回数据发现
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">数据集不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/discover" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            返回数据发现
          </Link>
          <div className="flex items-center space-x-2">
            {dataset.enableVisualization && (
              <Button variant="outline" size="sm">
                <EyeIcon className="mr-2 h-4 w-4" />
                可视化
              </Button>
            )}
            {dataset.enableAnalysis && (
              <Button variant="outline" size="sm">
                <BarChart3Icon className="mr-2 h-4 w-4" />
                数据分析
              </Button>
            )}
            <Button onClick={handleDownload} disabled={downloading}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              {downloading ? '下载中...' : '下载数据集'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Info */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {dataset.catalog}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {dataset.fileType.toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{dataset.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
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
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">文件大小</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(dataset.fileSize)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">下载次数</div>
                    <div className="text-sm text-muted-foreground">
                      {dataset.downloadCount} 次
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">数据集描述</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {dataset.description}
                  </p>
                </div>

                {(dataset.enableVisualization || dataset.enableAnalysis) && (
                  <div>
                    <h3 className="font-medium mb-2">支持功能</h3>
                    <div className="flex space-x-2">
                      {dataset.enableVisualization && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          数据可视化
                        </span>
                      )}
                      {dataset.enableAnalysis && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          <BarChart3Icon className="w-3 h-3 mr-1" />
                          统计分析
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">使用指南</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">数据引用格式</h4>
                  <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                    {dataset.name}. ({new Date(dataset.uploadTime).getFullYear()}). 
                    UCASS DataShare平台. 数据集ID: {dataset.id}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">使用须知</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 请遵守学术伦理规范</li>
                    <li>• 使用数据时请注明出处</li>
                    <li>• 仅限学术研究使用</li>
                    <li>• 如有疑问请联系平台管理员</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">数据集状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {dataset.isReviewed ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {dataset.isReviewed ? '已通过审核' : '等待审核'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {dataset.isVisible ? (
                    <EyeIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {dataset.isVisible ? '公开可见' : '暂不可见'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 