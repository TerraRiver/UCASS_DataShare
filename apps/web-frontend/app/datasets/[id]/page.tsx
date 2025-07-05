'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button, Chip } from '@nextui-org/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Navbar } from '@/components/navbar'
import {
  ArrowLeftIcon,
  DownloadIcon,
  CalendarIcon,
  FolderIcon,
  FileIcon,
  EyeIcon,
  BarChart3Icon,
  AlertCircleIcon,
  CopyIcon,
  StarIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from 'lucide-react'

interface DatasetFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  fileType: string
  mimeType?: string
  uploadTime: string
  isPreviewable: boolean
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
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: Record<string, string>[] } | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('main-info');
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<DatasetFile | null>(null);
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
    if (selectedPreviewFile) {
      fetchPreview(dataset!.id, selectedPreviewFile.id);
    } else {
      setPreviewData(null);
      setPreviewError('');
    }
  }, [selectedPreviewFile, dataset]);

  const apiSnippet = dataset ? `fetch('${window.location.origin}/api/datasets/${dataset.id}')
  .then(res => res.json())
  .then(data => console.log(data));` : '';

  const handleCopy = () => {
    if (!apiSnippet) return;
    navigator.clipboard.writeText(apiSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDataset = async (id: string) => {
    try {
      const response = await fetch(`/api/datasets/${id}`)
      const data = await response.json()

      if (response.ok) {
        setDataset(data.dataset)
        const firstPreviewable = data.dataset.files.find((f: DatasetFile) => f.isPreviewable);
        if (firstPreviewable) {
          setSelectedPreviewFile(firstPreviewable);
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

  const fetchPreview = async (datasetId: string, fileId: string) => {
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const response = await fetch(`/api/datasets/${datasetId}/preview/${fileId}`);
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
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
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
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dataset.name}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
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
    })
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-red-500">错误: {error}</div>
  if (!dataset) return <div className="p-8 text-center">未找到数据集</div>

  const previewableFiles = dataset.files.filter(f => f.isPreviewable);

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <main className="flex-1 min-w-0">
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">{dataset.name}</h1>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Chip color="primary" variant="flat" className="font-medium">{dataset.catalog}</Chip>
                        {dataset.isFeatured && <Chip color="warning" variant="flat" startContent={<StarIcon size={16}/>}>精选</Chip>}
                        {dataset.isReviewed && <Chip color="success" variant="flat" startContent={<ShieldCheckIcon size={16}/>}>已验证</Chip>}
                      </div>
                      {dataset.summary && (
                        <p className="text-gray-600 text-lg leading-relaxed">{dataset.summary}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:ml-6">
                      <Button 
                        as={Link} 
                        href="/discover" 
                        variant="ghost" 
                        className="border border-gray-300 hover:bg-gray-50"
                        startContent={<ArrowLeftIcon className="h-4 w-4" />}
                      >
                        返回发现
                      </Button>
                      <Button 
                        as={Link} 
                        href="/" 
                        variant="ghost"
                        className="border border-gray-300 hover:bg-gray-50"
                      >
                        返回首页
                      </Button>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{dataset.files.length}</div>
                        <div className="text-sm text-gray-500">文件数量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{dataset.downloadCount}</div>
                        <div className="text-sm text-gray-500">下载次数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{formatDate(dataset.uploadTime)}</div>
                        <div className="text-sm text-gray-500">上传日期</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {dataset.files.reduce((total, file) => total + file.fileSize, 0) > 0 
                            ? formatFileSize(dataset.files.reduce((total, file) => total + file.fileSize, 0))
                            : '0 B'
                          }
                        </div>
                        <div className="text-sm text-gray-500">总大小</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File List Section */}
                <section id="file-list" className="scroll-mt-20">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-xl font-semibold text-gray-900">文件列表</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleSelectAllFiles}
                            className="border border-gray-300"
                          >
                            {selectedFiles.length === dataset.files.length ? '取消全选' : '全选'}
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            onClick={handleDownloadZip}
                            disabled={selectedFiles.length === 0 || downloadingZip}
                            isLoading={downloadingZip}
                            className="font-medium"
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            下载选中 ({selectedFiles.length})
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-200">
                        {dataset.files.map((file, index) => (
                          <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                  checked={selectedFiles.includes(file.id)}
                                  onChange={() => handleFileSelect(file.id)}
                                />
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <FileIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{file.originalName}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-4">
                                    <span>{formatFileSize(file.fileSize)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.uploadTime)}</span>
                                    {file.isPreviewable && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600 font-medium">可预览</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {file.isPreviewable && (
                                  <Button 
                                    size="sm" 
                                    variant="light"
                                    onClick={() => {
                                      setSelectedPreviewFile(file);
                                      document.getElementById('data-preview')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <EyeIcon className="w-4 h-4 mr-1" /> 预览
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDownloadSingle(file.id, file.originalName)}
                                  className="text-gray-600 hover:text-gray-700 border border-gray-300"
                                >
                                  <DownloadIcon className="w-4 h-4 mr-1" /> 下载
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Dataset Description Section */}
                <section id="dataset-description" className="scroll-mt-20">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50/50">
                      <CardTitle className="text-xl font-semibold text-gray-900">数据集描述</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="prose prose-gray max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {dataset.description}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Data Preview Section */}
                {dataset.enablePreview && (
                  <section id="data-preview" className="scroll-mt-20">
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader className="bg-gray-50/50">
                        <CardTitle className="text-xl font-semibold text-gray-900">数据预览</CardTitle>
                        <div className="mt-3 text-sm text-gray-600">
                          选择一个文件进行内容预览：
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {dataset.files.filter(f => f.isPreviewable).map(file => (
                            <Button
                              key={file.id}
                              size="sm"
                              variant={selectedPreviewFile?.id === file.id ? "flat" : "ghost"}
                              color={selectedPreviewFile?.id === file.id ? "danger" : "default"}
                              onClick={() => setSelectedPreviewFile(file)}
                              className="border border-gray-300"
                            >
                              {file.originalName}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {loadingPreview ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">加载中...</p>
                          </div>
                        ) : previewError ? (
                          <Alert variant="destructive" className="border-red-200">
                            <AlertCircleIcon className="h-4 w-4" />
                            <AlertTitle>预览失败</AlertTitle>
                            <AlertDescription>{previewError}</AlertDescription>
                          </Alert>
                        ) : previewData ? (
                          <div className="overflow-x-auto border rounded-lg bg-white">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="sticky left-0 z-10 bg-gray-50 w-12 px-3 py-2 text-center font-medium text-gray-700 border-r">#</th>
                                  {previewData.headers.map((header, index) => (
                                    <th key={index} className="px-3 py-2 font-medium text-gray-700 border-r text-left">{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {previewData.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white w-12 px-3 py-2 text-center text-gray-500 border-r font-mono text-xs">{rowIndex + 1}</td>
                                    {previewData.headers.map((header, colIndex) => (
                                      <td key={colIndex} className="px-3 py-2 border-r text-gray-900 whitespace-nowrap">{row[header]}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {dataset.files.some(f => f.isPreviewable)
                              ? '请选择一个文件以查看预览。'
                              : '该数据集没有可预览的文件。'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </section>
                )}

                {/* API Usage Section */}
                <section id="api-usage" className="scroll-mt-20">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50/50">
                      <CardTitle className="text-xl font-semibold text-gray-900">API 调用</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="relative">
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertTitle className="text-blue-900">API 使用示例</AlertTitle>
                          <AlertDescription className="text-blue-800">
                            <pre className="mt-3 w-full whitespace-pre-wrap rounded-md bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto">
                              <code>{apiSnippet}</code>
                            </pre>
                          </AlertDescription>
                        </Alert>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCopy} 
                          className="absolute top-3 right-3 bg-white/80 hover:bg-white border border-gray-300"
                        >
                          {copied ? <CheckCircleIcon size={16} className="text-green-600" /> : <CopyIcon size={16} />}
                          <span className="ml-1 text-xs">{copied ? '已复制' : '复制'}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </main>

            {/* Enhanced Sidebar */}
            <aside className="lg:w-80 w-full lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-6">
                {/* Navigation Card */}
                <Card className="shadow-lg border border-gray-300 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      页面导航
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <nav className="space-y-1">
                      {sections.map((section, index) => {
                        const isVisible = !(section.id === 'data-preview' && !dataset.enablePreview);
                        if (!isVisible) return null;
                        
                        // 为每个导航项添加不同的图标
                        const getIcon = (sectionId: string) => {
                          switch(sectionId) {
                            case 'main-info':
                              return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                            case 'file-list':
                              return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                            case 'dataset-description':
                              return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                            case 'data-preview':
                              return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
                            default:
                              return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
                          }
                        };

                        return (
                          <button
                            key={section.id}
                            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium transition-all duration-200 rounded-lg flex items-center gap-3 group border border-transparent hover:border-red-500 hover:shadow-md"
                          >
                            <span className="text-red-500 group-hover:text-white transition-colors">
                              {getIcon(section.id)}
                            </span>
                            <span className="flex-1">{section.title}</span>
                            <span className="text-gray-400 group-hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="shadow-sm border border-gray-200">
                  <CardHeader className="bg-gray-50/50 pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900">快速操作</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <Button
                      onClick={() => {
                        setSelectedFiles(dataset.files.map(f => f.id));
                        handleDownloadZip();
                      }}
                      disabled={downloadingZip}
                      isLoading={downloadingZip}
                      className="w-full"
                      color="danger"
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      下载全部文件
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="ghost"
                      className="w-full border border-gray-300"
                    >
                      打印页面
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.share?.({
                          title: dataset.name,
                          text: dataset.summary || dataset.description.substring(0, 100),
                          url: window.location.href
                        });
                      }}
                      variant="ghost"
                      className="w-full border border-gray-300"
                    >
                      分享数据集
                    </Button>
                  </CardContent>
                </Card>

                {/* Dataset Info Card */}
                <Card className="shadow-sm border border-gray-200">
                  <CardHeader className="bg-gray-50/50 pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900">数据集信息</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">分类</span>
                      <Chip color="primary" variant="flat" size="sm">{dataset.catalog}</Chip>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">状态</span>
                      <div className="flex gap-1">
                        {dataset.isReviewed && <Chip color="success" variant="flat" size="sm">已验证</Chip>}
                        {dataset.isFeatured && <Chip color="warning" variant="flat" size="sm">精选</Chip>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">可视化</span>
                      <span className="text-sm font-medium">{dataset.enableVisualization ? '支持' : '不支持'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">分析功能</span>
                      <span className="text-sm font-medium">{dataset.enableAnalysis ? '支持' : '不支持'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <footer className="w-full flex items-center justify-center py-3 bg-white border-t border-gray-200">
        <span className="text-default-600">中国社会科学院大学</span>
        <p className="text-primary ml-2">© 2024</p>
      </footer>
    </div>
  );
}