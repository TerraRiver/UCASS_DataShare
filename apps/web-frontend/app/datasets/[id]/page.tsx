'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button, Chip, Tabs, Tab } from '@nextui-org/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Navbar } from '@/components/navbar'
import {
  DownloadIcon,
  CalendarIcon,
  FileIcon,
  EyeIcon,
  BarChart3Icon,
  AlertCircleIcon,
  CopyIcon,
  StarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  Building2Icon,
  LinkIcon,
  TrendingUpIcon,
  ExternalLinkIcon,
  BookOpenIcon,
  FileTextIcon
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

interface RelatedCaseStudy {
  id: string
  name: string
  summary?: string
}

interface Dataset {
  id: string
  name: string
  catalog: string
  summary?: string
  source?: string
  sourceUrl?: string
  uploadTime: string
  downloadCount: number
  previewCount?: number
  enableDataAnalysis: boolean
  enablePreview: boolean
  isReviewed: boolean
  isVisible: boolean
  isFeatured: boolean
  recommendedCitations?: string[]
  files: DatasetFile[]
  relatedCaseStudies?: RelatedCaseStudy[]
}

export default function DatasetDetailPage() {
  const params = useParams()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readmeContent, setReadmeContent] = useState<string>('')
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: Record<string, string>[] } | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<DatasetFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

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

  const apiSnippet = dataset ? `// 获取数据集信息
fetch('${window.location.origin}/api/datasets/${dataset.id}')
  .then(res => res.json())
  .then(data => console.log(data));

// 下载文件
fetch('${window.location.origin}/api/datasets/${dataset.id}/download/FILE_ID')
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filename';
    a.click();
  });` : '';

  const handleCopy = () => {
    if (!apiSnippet) return;
    navigator.clipboard.writeText(apiSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDataset = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/datasets/${id}`, { headers })
      const data = await response.json()

      if (response.ok) {
        setDataset(data.dataset)
        const firstPreviewable = data.dataset.files.find((f: DatasetFile) => f.isPreviewable);
        if (firstPreviewable) {
          setSelectedPreviewFile(firstPreviewable);
        }

        // 查找 Markdown 文件用于渲染 README
        // 优先级：1. readme.md/README.md  2. 任意 .md 文件  3. 无
        let readmeFile = data.dataset.files?.find((file: DatasetFile) => {
          const fileName = file.originalName.toLowerCase();
          const baseName = fileName.split('/').pop()?.split('\\').pop() || '';
          return baseName === 'readme.md';
        });

        // 如果没有找到 readme.md，查找任意 .md 文件
        if (!readmeFile) {
          readmeFile = data.dataset.files?.find((file: DatasetFile) => {
            return file.fileType.toLowerCase() === '.md';
          });
        }

        if (readmeFile) {
          fetchReadme(id, readmeFile.id);
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

  const fetchReadme = async (datasetId: string, fileId: string) => {
    setReadmeLoading(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/files/${fileId}`);
      if (response.ok) {
        const text = await response.text();
        setReadmeContent(text);
      }
    } catch (error) {
      console.error('Failed to fetch README:', error);
    } finally {
      setReadmeLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="relative flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-4">错误: {error}</p>
            <Button as={Link} href="/discover" className="bg-red-600 text-white">
              返回发现页
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="relative flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">未找到数据集</p>
            <Button as={Link} href="/discover" className="bg-red-600 text-white">
              返回发现页
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1
                className="text-4xl md:text-5xl font-light text-gray-900 mb-6"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                {dataset.name}
              </h1>
              <div className="h-1 w-20 bg-red-600 mb-6"></div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Chip className="bg-red-50 text-red-700 border border-red-200">
                  {dataset.catalog}
                </Chip>
                {dataset.isFeatured && (
                  <Chip
                    className="bg-amber-50 text-amber-700 border border-amber-200"
                    startContent={<StarIcon className="w-3.5 h-3.5" />}
                  >
                    精选数据集
                  </Chip>
                )}
                {dataset.isReviewed && (
                  <Chip
                    className="bg-green-50 text-green-700 border border-green-200"
                    startContent={<ShieldCheckIcon className="w-3.5 h-3.5" />}
                  >
                    已验证
                  </Chip>
                )}
                {dataset.enablePreview && (
                  <Chip
                    className="bg-blue-50 text-blue-700 border border-blue-200"
                    startContent={<EyeIcon className="w-3.5 h-3.5" />}
                  >
                    支持预览
                  </Chip>
                )}
                {dataset.enableDataAnalysis && (
                  <Chip
                    className="bg-purple-50 text-purple-700 border border-purple-200"
                    startContent={<BarChart3Icon className="w-3.5 h-3.5" />}
                  >
                    支持分析
                  </Chip>
                )}
              </div>

              {/* Summary */}
              {dataset.summary && (
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {dataset.summary}
                </p>
              )}

              {/* Source Info */}
              {dataset.source && (
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Building2Icon className="w-4 h-4 mr-2" />
                    <span className="font-medium">数据来源：</span>
                    <span className="ml-2">{dataset.source}</span>
                  </div>
                  {dataset.sourceUrl && (
                    <div className="flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <a
                        href={dataset.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        访问数据来源地址
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {dataset.files.length}
                </div>
                <div className="text-sm text-gray-600">文件数量</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {dataset.downloadCount}
                </div>
                <div className="text-sm text-gray-600">下载次数</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {dataset.previewCount || 0}
                </div>
                <div className="text-sm text-gray-600">预览次数</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {formatFileSize(dataset.files.reduce((total, file) => total + file.fileSize, 0))}
                </div>
                <div className="text-sm text-gray-600">总大小</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => {
                  setSelectedFiles(dataset.files.map(f => f.id));
                  handleDownloadZip();
                }}
                disabled={downloadingZip}
                className="bg-red-600 text-white hover:bg-red-700 px-6"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                下载全部文件
              </Button>

              {dataset.enableDataAnalysis && (
                <Button
                  as="a"
                  href="https://shehui.org"
                  target="_blank"
                  className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 px-6"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                  在社慧平台分析
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <Tabs
              aria-label="数据集详情"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-200",
                cursor: "w-full bg-red-600",
                tab: "max-w-fit px-6 h-12",
                tabContent: "group-data-[selected=true]:text-gray-900 font-medium text-gray-600"
              }}
            >
              {/* 文件列表 Tab */}
              <Tab
                key="files"
                title={
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    <span>文件列表</span>
                  </div>
                }
              >
                <div className="py-8">
                  <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        数据文件
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="bordered"
                          onClick={handleSelectAllFiles}
                          className="border-gray-300"
                        >
                          {selectedFiles.length === dataset.files.length ? '取消全选' : '全选'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDownloadZip}
                          disabled={selectedFiles.length === 0 || downloadingZip}
                          className="bg-red-600 text-white"
                        >
                          <DownloadIcon className="w-4 h-4 mr-1" />
                          下载选中 ({selectedFiles.length})
                        </Button>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {dataset.files.map((file) => (
                        <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => handleFileSelect(file.id)}
                              />
                              <div className="p-3 bg-red-50 rounded-lg">
                                <FileIcon className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate mb-1">
                                  {file.originalName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-4">
                                  <span>{formatFileSize(file.fileSize)}</span>
                                  <span>•</span>
                                  <span>{file.fileType}</span>
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
                                  className="text-blue-600"
                                  onClick={() => setSelectedPreviewFile(file)}
                                >
                                  <EyeIcon className="w-4 h-4 mr-1" /> 预览
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="bordered"
                                className="border-gray-300"
                                onClick={() => handleDownloadSingle(file.id, file.originalName)}
                              >
                                <DownloadIcon className="w-4 h-4 mr-1" /> 下载
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tab>

              {/* 数据描述 Tab */}
              <Tab
                key="description"
                title={
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4" />
                    <span>数据描述</span>
                  </div>
                }
              >
                <div className="py-8">
                  <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        {readmeContent ? 'README.md' : '数据集描述'}
                      </h3>
                    </div>
                    <div className="p-6">
                      {readmeLoading ? (
                        <div className="flex justify-center py-12">
                          <div className="text-gray-500">加载README...</div>
                        </div>
                      ) : readmeContent ? (
                        <div className="prose prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg max-w-none
                          prose-code:text-sm prose-code:bg-gray-100 prose-code:text-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {readmeContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-12">
                          <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>未提供数据集描述</p>
                          <p className="text-sm mt-2">上传时可包含 README.md 文件</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Tab>

              {/* 数据预览 Tab */}
              {dataset.enablePreview && dataset.files.some(f => f.isPreviewable) && (
                <Tab
                  key="preview"
                  title={
                    <div className="flex items-center gap-2">
                      <EyeIcon className="w-4 h-4" />
                      <span>数据预览</span>
                    </div>
                  }
                >
                  <div className="py-8">
                    <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3
                          className="text-xl font-medium text-gray-900 mb-4"
                          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                        >
                          数据预览
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          选择一个文件进行内容预览：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dataset.files.filter(f => f.isPreviewable).map(file => (
                            <Button
                              key={file.id}
                              size="sm"
                              variant={selectedPreviewFile?.id === file.id ? "solid" : "bordered"}
                              className={selectedPreviewFile?.id === file.id ? "bg-red-600 text-white" : "border-gray-300"}
                              onClick={() => setSelectedPreviewFile(file)}
                            >
                              {file.originalName}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="p-6">
                        {loadingPreview ? (
                          <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">加载中...</p>
                          </div>
                        ) : previewError ? (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircleIcon className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-900">预览失败</AlertTitle>
                            <AlertDescription className="text-red-800">{previewError}</AlertDescription>
                          </Alert>
                        ) : previewData ? (
                          <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-red-50 border-b-2 border-red-100">
                                <tr>
                                  <th className="sticky left-0 z-10 bg-red-50 w-12 px-3 py-3 text-center font-medium text-red-900 border-r-2 border-red-100">#</th>
                                  {previewData.headers.map((header, index) => (
                                    <th key={index} className="px-4 py-3 font-medium text-red-900 border-r border-red-100 text-left whitespace-nowrap">{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {previewData.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white w-12 px-3 py-3 text-center text-gray-500 border-r-2 border-gray-100 font-mono text-xs">{rowIndex + 1}</td>
                                    {previewData.headers.map((header, colIndex) => (
                                      <td key={colIndex} className="px-4 py-3 border-r border-gray-100 text-gray-900 whitespace-nowrap">{row[header]}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            请选择一个文件以查看预览。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Tab>
              )}

              {/* 引用文献 Tab */}
              {dataset.recommendedCitations && dataset.recommendedCitations.length > 0 && (
                <Tab
                  key="citations"
                  title={
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="w-4 h-4" />
                      <span>引用文献</span>
                    </div>
                  }
                >
                  <div className="py-8">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-amber-200 bg-amber-100">
                        <h3
                          className="text-xl font-medium text-gray-900 mb-2"
                          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                        >
                          推荐引用文献
                        </h3>
                        <p className="text-sm text-gray-700">
                          使用本数据集时，推荐引用以下文献（国标格式）：
                        </p>
                      </div>
                      <div className="p-6">
                        <ol className="space-y-6">
                          {dataset.recommendedCitations.map((citation, index) => (
                            <li key={index} className="flex gap-4">
                              <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-bold">
                                {index + 1}
                              </span>
                              <div className="flex-1 pt-1">
                                <p className="text-gray-800 leading-relaxed">{citation}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </Tab>
              )}

              {/* API 调用 Tab */}
              <Tab
                key="api"
                title={
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>API 调用</span>
                  </div>
                }
              >
                <div className="py-8">
                  <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        API 使用示例
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto font-mono text-sm">
                          <code>{apiSnippet}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="bordered"
                          onClick={handleCopy}
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white border-gray-300"
                        >
                          {copied ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                              <span className="text-xs">已复制</span>
                            </>
                          ) : (
                            <>
                              <CopyIcon className="w-4 h-4 mr-1" />
                              <span className="text-xs">复制代码</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>提示：</strong>您可以使用上述 API 接口获取数据集信息和下载文件。请将 FILE_ID 替换为实际的文件 ID。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              {/* 关联案例 Tab */}
              {dataset.relatedCaseStudies && dataset.relatedCaseStudies.length > 0 && (
                <Tab
                  key="cases"
                  title={
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="w-4 h-4" />
                      <span>相关案例</span>
                    </div>
                  }
                >
                  <div className="py-8">
                    <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3
                          className="text-xl font-medium text-gray-900"
                          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                        >
                          使用此数据集的案例集
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid gap-4">
                          {dataset.relatedCaseStudies.map((caseStudy) => (
                            <Link
                              key={caseStudy.id}
                              href={`/casestudies/${caseStudy.id}`}
                              className="block p-6 border-2 border-gray-100 rounded-lg hover:border-red-300 hover:shadow-lg transition-all"
                            >
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {caseStudy.name}
                              </h4>
                              {caseStudy.summary && (
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {caseStudy.summary}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>
              )}
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
