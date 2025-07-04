'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

interface DatasetFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  fileType: string
  mimeType?: string
  uploadTime: string
}

interface Dataset {
  id: string
  name: string
  catalog: string
  summary?: string
  description: string
  uploadTime: string
  downloadCount: number
  enableVisualization: boolean
  enableAnalysis: boolean
  enablePreview: boolean
  isReviewed: boolean
  isVisible: boolean
  isFeatured: boolean
  files: DatasetFile[]
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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const sections = [
    { id: 'main-info', title: '基本信息' },
    { id: 'file-list', title: '文件列表' },
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
        // Fetch preview data if dataset is eligible and preview is enabled
        const csvFile = data.dataset.files.find((f: DatasetFile) => f.fileType.toLowerCase() === '.csv');
        if (csvFile && data.dataset.enablePreview) {
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

  const handleDownloadSingle = async (fileId: string, fileName: string) => {
    if (!dataset) return

    try {
      const response = await fetch(`/api/datasets/${dataset.id}/download/${fileId}`)
      
      if (response.ok) {
        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
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
    }
  }

  const handleDownloadZip = async () => {
    if (!dataset || selectedFiles.length === 0) return

    setDownloadingZip(true)
    try {
      const response = await fetch(`/api/datasets/${dataset.id}/download/zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      })
      
      if (response.ok) {
        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dataset.name}.zip`
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
      setDownloadingZip(false)
    }
  }

  const handleSelectAllFiles = () => {
    if (selectedFiles.length === dataset?.files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(dataset?.files.map(f => f.id) || [])
    }
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
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
            {dataset.enablePreview && dataset.files.some((f: DatasetFile) => f.fileType.toLowerCase() === '.csv') && (
              <Button variant="outline" size="sm" onClick={() => document.getElementById('data-preview')?.scrollIntoView({ behavior: 'smooth' })}>
                <EyeIcon className="mr-2 h-4 w-4" />
                数据预览
              </Button>
            )}
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
            {dataset.files.length === 1 ? (
              <Button 
                onClick={() => handleDownloadSingle(dataset.files[0].id, dataset.files[0].originalName)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                下载文件
              </Button>
            ) : (
              <Button 
                onClick={() => document.getElementById('file-list')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                查看文件列表
              </Button>
            )}
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
                      <div className="text-sm font-medium">文件信息</div>
                      <div className="text-sm text-muted-foreground">
                        {dataset.files.length} 个文件 • {formatFileSize(dataset.files.reduce((sum, f) => sum + f.fileSize, 0))}
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
                      <div className="text-sm text-muted-foreground">
                        请在"文件列表"部分选择需要下载的文件，支持单个文件下载或批量打包下载。
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
                      {dataset.isFeatured ? <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
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
                    <div className="flex items-center space-x-2">
                      {dataset.enablePreview ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">支持数据预览</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File List Section */}
            <Card id="file-list" className="mb-8 scroll-mt-28">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>文件列表</span>
                  <div className="flex items-center space-x-2">
                    {dataset.files.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllFiles}
                        >
                          {selectedFiles.length === dataset.files.length ? '取消全选' : '全选'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDownloadZip}
                          disabled={selectedFiles.length === 0 || downloadingZip}
                        >
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          {downloadingZip ? '打包中...' : `打包下载 (${selectedFiles.length})`}
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataset.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        {dataset.files.length > 1 && (
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize)} • {formatDate(file.uploadTime)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(file.id, file.originalName)}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
                {dataset.files.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无文件
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dataset Description Section */}
            <Card id="dataset-description" className="mb-8 scroll-mt-28">
              <CardHeader>
                <CardTitle>数据集描述</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义组件样式
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold text-foreground mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-foreground mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-medium text-foreground mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-4" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-4" {...props} />,
                      table: ({node, ...props}) => <table className="w-full border-collapse border border-border mb-4" {...props} />,
                      th: ({node, ...props}) => <th className="border border-border p-2 bg-muted font-medium text-left" {...props} />,
                      td: ({node, ...props}) => <td className="border border-border p-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                    }}
                  >
                    {dataset.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Data Preview Section */}
            <Card id="data-preview" className="mb-8 scroll-mt-28">
              <CardHeader>
                <CardTitle>数据预览</CardTitle>
              </CardHeader>
              <CardContent>
                {!dataset.enablePreview ? (
                  <Alert>
                    <AlertDescription>该数据集未启用预览功能。</AlertDescription>
                  </Alert>
                ) : !dataset.files.some((f: DatasetFile) => f.fileType.toLowerCase() === '.csv') ? (
                  <Alert>
                    <AlertDescription>当前仅支持 CSV 文件预览，该数据集中没有 CSV 文件。</AlertDescription>
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