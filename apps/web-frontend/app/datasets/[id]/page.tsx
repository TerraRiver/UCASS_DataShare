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
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  ShieldCheckIcon,
  CopyIcon,
  StarIcon
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
  isFeatured: boolean
}

export default function DatasetDetailPage() {
  const params = useParams()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: Record<string, string>[] } | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('main-info');
  const [copied, setCopied] = useState(false);

  const sections = [
    { id: 'main-info', title: '基本信息' },
    { id: 'dataset-description', title: '数据集描述' },
    { id: 'data-preview', title: '数据预览' },
  ];

  useEffect(() => {
    if (params.id) {
      fetchDataset(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    const handleScroll = () => {
      // Offset to account for the sticky header
      const offset = 120;
      const currentSection = sections
        .map(s => document.getElementById(s.id))
        .filter(el => el)
        .reverse()
        .find(el => el!.getBoundingClientRect().top <= offset);
      
      if (currentSection) {
        setActiveSection(currentSection.id);
      } else {
        setActiveSection('main-info');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const apiSnippet = dataset ? `fetch('${window.location.origin}/api/datasets/${dataset.id}')
  .then(res => res.json())
  .then(data => console.log(data));` : '';

  const handleCopy = () => {
    if (!apiSnippet) return;
    navigator.clipboard.writeText(apiSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  const fetchDataset = async (id: string) => {
    try {
      const response = await fetch(`/api/datasets/${id}`)
      const data = await response.json()

      if (response.ok) {
        setDataset(data.dataset)
        // Fetch preview data if dataset is eligible
        if (data.dataset.fileType.toLowerCase() === '.csv') {
          fetchPreview(id);
        }
      } else {
        setError(data.error || '获取数据集详情失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const fetchPreview = async (id: string) => {
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const response = await fetch(`/api/datasets/${id}/preview`);
      const data = await response.json();
      if (response.ok) {
        setPreviewData(data.preview);
      } else {
        setPreviewError(data.error || '加载预览失败');
      }
    } catch (error) {
      setPreviewError('加载预览时发生网络错误');
    } finally {
      setLoadingPreview(false);
    }
  };

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

  const citationYear = dataset ? new Date(dataset.uploadTime).getFullYear() : '';
  const citation = dataset ? `${dataset.name}. (${citationYear}). UCASS DataShare平台. 数据集ID: ${dataset.id}` : '';

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
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Left Side Navigation */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-28 self-start mb-8 lg:mb-0">
            <nav className="space-y-1">
              <h3 className="font-semibold text-lg px-3 mb-2">页面导航</h3>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(section.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                    setActiveSection(section.id);
                  }}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Right Side Content */}
          <main className="flex-1 min-w-0">
            {/* Main Info */}
            <Card id="main-info" className="mb-8 scroll-mt-28">
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
              <CardContent className="space-y-8">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
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

                {/* Usage Guide */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <InfoIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">使用指南</h3>
                  </div>
                  <div className="space-y-4 pl-2">
                    <div>
                      <h4 className="font-medium text-sm mb-2">下载数据集</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={handleDownload} disabled={downloading}>
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          {downloading ? '下载中...' : `下载原始文件 (${dataset.fileType.toUpperCase()})`}
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          下载为 .CSV
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          下载为 .JSON
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2 pt-2">API 调用</h4>
                      <div className="relative bg-muted/50 p-3 rounded-md">
                        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto pr-10">
                          <code>{apiSnippet}</code>
                        </pre>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={handleCopy}
                        >
                          {copied ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm pt-2">使用须知</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>请遵守学术伦理规范</li>
                        <li>使用数据时请注明出处</li>
                        <li>仅限学术研究使用</li>
                        <li>如有疑问请联系平台管理员</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Dataset Status */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">数据集状态</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-2">
                    <div className="flex items-center space-x-2">
                      {dataset.isReviewed ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">已通过审核</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dataset.isVisible ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">公开可见</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dataset.isFeatured ? <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarIcon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">精选数据集</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dataset.enableVisualization ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">支持可视化</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dataset.enableAnalysis ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">支持数据分析</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dataset Description Section */}
            <Card id="dataset-description" className="mb-8 scroll-mt-28">
              <CardHeader>
                <CardTitle>数据集描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {dataset.description}
                </p>
              </CardContent>
            </Card>

            {/* Data Preview Section */}
            <Card id="data-preview" className="mb-8 scroll-mt-28">
              <CardHeader>
                <CardTitle>数据预览</CardTitle>
              </CardHeader>
              <CardContent>
                {dataset.fileType.toLowerCase() !== '.csv' ? (
                  <Alert>
                    <AlertDescription>当前仅支持 CSV 文件预览。</AlertDescription>
                  </Alert>
                ) : loadingPreview ? (
                  <p>加载预览中...</p>
                ) : previewError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{previewError}</AlertDescription>
                  </Alert>
                ) : previewData && previewData.rows.length > 0 ? (
                  <div className="relative max-h-[600px] overflow-auto border rounded-lg shadow-inner bg-card">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="sticky top-0 left-0 z-20 p-2 font-bold text-center bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            #
                          </th>
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="sticky top-0 z-10 p-2 font-bold text-left bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="even:bg-slate-50/50 dark:even:bg-white/5">
                            <td className="sticky left-0 p-2 font-mono text-center text-muted-foreground bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {rowIndex + 1}
                            </td>
                            {previewData.headers.map((header, colIndex) => (
                              <td key={colIndex} className="p-2 text-foreground whitespace-nowrap border border-slate-200 dark:border-slate-700">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>没有可用的预览数据。</p>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
} 