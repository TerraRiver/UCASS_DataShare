'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon, XIcon, BookOpenIcon, InfoIcon, VideoIcon, CodeIcon } from 'lucide-react'

const caseStudySchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  author: z.string().min(1, '作者不能为空'),
  discipline: z.string().min(1, '请选择学科分类'),
  summary: z.string().max(50, '简述不能超过50个字符').optional().or(z.literal('')),
  publication: z.string().min(1, '发表期刊/来源不能为空'),
  publicationYear: z.coerce.number().min(1900, '年份不正确').max(new Date().getFullYear(), '年份不正确'),
  publicationUrl: z.string().url('请输入有效的URL').optional().or(z.literal('')),
})

type CaseStudyFormData = z.infer<typeof caseStudySchema>

const disciplines = [
  '政治学', '经济学', '社会学', '传统与现代文化', '法学',
  '新闻传播', '计算科学', '数学', '其他'
]

const MAX_FILES = 15

export default function UploadCaseStudyPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', 'true')
      folderInputRef.current.setAttribute('directory', 'true')
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CaseStudyFormData>({
    resolver: zodResolver(caseStudySchema),
  })

  // Watch form fields for real-time progress calculation
  const formData = watch()

  // Calculate real progress based on form completion
  const progress = useMemo(() => {
    let completedSteps = 0
    let totalSteps = 0

    // Step 1: Basic Information (4 required fields)
    totalSteps += 4
    if (formData?.title) completedSteps++
    if (formData?.author) completedSteps++
    if (formData?.discipline) completedSteps++
    if (formData?.summary) completedSteps++

    // Step 2: Publication Information (3 fields, 2 required)
    totalSteps += 3
    if (formData?.publication) completedSteps++
    if (formData?.publicationYear) completedSteps++
    if (formData?.publicationUrl) completedSteps++

    // Step 3: Files (required)
    totalSteps += 1
    if (selectedFiles.length > 0) completedSteps++

    return Math.round((completedSteps / totalSteps) * 100)
  }, [formData, selectedFiles])

  // Determine current step based on what's filled
  const currentStep = useMemo(() => {
    if (!formData?.title || !formData?.author || !formData?.discipline) return 1
    if (!formData?.publication || !formData?.publicationYear) return 2
    if (selectedFiles.length === 0) return 3
    return 3
  }, [formData, selectedFiles])

  const getFileDisplayName = (file: File) => {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    return relativePath && relativePath.length > 0 ? relativePath : file.name
  }

  const getFileIdentifier = (file: File) => `${getFileDisplayName(file)}-${file.size}`

  const mergeFiles = (currentFiles: File[], incomingFiles: File[]) => {
    const duplicates: string[] = []
    const uniqueIncoming: File[] = []
    const existingIds = new Set(currentFiles.map(getFileIdentifier))

    incomingFiles.forEach(file => {
      const identifier = getFileIdentifier(file)
      const isDuplicate =
        existingIds.has(identifier) ||
        uniqueIncoming.some(existing => getFileIdentifier(existing) === identifier)

      if (isDuplicate) {
        duplicates.push(getFileDisplayName(file))
      } else {
        uniqueIncoming.push(file)
      }
    })

    const availableSlots = MAX_FILES - currentFiles.length

    if (availableSlots <= 0) {
      return {
        nextFiles: currentFiles,
        duplicates,
        addedCount: 0,
        truncatedCount: uniqueIncoming.length,
        limitReached: uniqueIncoming.length > 0
      }
    }

    const acceptedFiles = uniqueIncoming.slice(0, availableSlots)
    const truncatedCount = uniqueIncoming.length - acceptedFiles.length

    return {
      nextFiles: acceptedFiles.length ? [...currentFiles, ...acceptedFiles] : currentFiles,
      duplicates,
      addedCount: acceptedFiles.length,
      truncatedCount,
      limitReached: truncatedCount > 0
    }
  }

  const addFiles = (incomingFiles: File[]) => {
    if (!incomingFiles || incomingFiles.length === 0) {
      return
    }

    const { nextFiles, duplicates, addedCount, truncatedCount, limitReached } = mergeFiles(
      selectedFiles,
      incomingFiles
    )

    if (duplicates.length > 0) {
      alert(`????????/??????:
${duplicates.join('
')}`)
    }

    if (addedCount === 0) {
      if (limitReached && truncatedCount > 0) {
        alert(`??????${MAX_FILES}????????/?????`)
      }
      return
    }

    if (truncatedCount > 0) {
      alert(`??????${MAX_FILES}????????/???????${truncatedCount}????`)
    }

    setSelectedFiles(nextFiles)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])
    addFiles(newFiles)
    event.target.value = ''
  }

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])
    addFiles(newFiles)
    event.target.value = ''
  }

  const extractFilesFromEntry = (entry: any): Promise<File[]> => {
    if (!entry) return Promise.resolve([])

    if (entry.isFile) {
      return new Promise((resolve, reject) => {
        entry.file((file: File) => resolve([file]), reject)
      })
    }

    if (entry.isDirectory) {
      return new Promise((resolve, reject) => {
        const reader = entry.createReader()
        const allFiles: File[] = []

        const readEntries = () => {
          reader.readEntries(async (entries: any[]) => {
            if (!entries.length) {
              resolve(allFiles)
              return
            }
            try {
              for (const dirEntry of entries) {
                const childFiles = await extractFilesFromEntry(dirEntry)
                allFiles.push(...childFiles)
              }
              readEntries()
            } catch (error) {
              reject(error)
            }
          }, reject)
        }

        readEntries()
      })
    }

    return Promise.resolve([])
  }

  const collectFilesFromItems = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind !== 'file') continue
      const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null
      if (entry) {
        const entryFiles = await extractFilesFromEntry(entry)
        files.push(...entryFiles)
      } else {
        const file = item.getAsFile()
        if (file) {
          files.push(file)
        }
      }
    }
    return files
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    let newFiles: File[] = []

    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      try {
        newFiles = await collectFilesFromItems(e.dataTransfer.items)
      } catch (error) {
        console.error('????????/????:', error)
      }
    }

    if (newFiles.length === 0) {
      newFiles = Array.from(e.dataTransfer.files)
    }

    addFiles(newFiles)
  }

  // ??????

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileTypeStyle = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'csv': return 'bg-green-100 text-green-700 border-green-200'
      case 'xlsx': case 'xls': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pdf': return 'bg-red-100 text-red-700 border-red-200'
      case 'json': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'zip': case 'rar': case '7z': case 'tar': case 'gz': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'txt': case 'md': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'doc': case 'docx': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'py': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'r': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'mp4': case 'avi': case 'mov': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'ipynb': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const onSubmit = async (data: CaseStudyFormData) => {
    if (selectedFiles.length === 0) {
      setUploadResult({ success: false, message: '请至少上传一个文件' })
      setShowResultDialog(true)
      return
    }

    setUploading(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    selectedFiles.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/casestudies/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (response.ok) {
        setUploadResult({ success: true, message: '案例集上传成功！您的案例集将在审核通过后对所有用户可见,通常在1-3个工作日内完成审核。' })
        reset()
        setSelectedFiles([])
      } else {
        setUploadResult({ success: false, message: result.error || '上传失败,请重试' })
      }
    } catch (error) {
      setUploadResult({ success: false, message: '网络错误,请稍后再试' })
    } finally {
      setUploading(false)
      setShowResultDialog(true)
    }
  }

  return (
    <div className="min-h-screen bg-white -mx-6 -mt-16">
      {/* Hero Section */}
      <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1
              className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
            >
              案例集上传
            </h1>
            <div className="h-1 w-20 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              分享您的论文复现资源包,促进学术研究的透明与合作
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-full">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <span>论文复现</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-full">
                <CheckCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
              <span>学术共享</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-full">
                <CheckCircleIcon className="h-4 w-4 text-purple-600" />
              </div>
              <span>开源协作</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 px-8">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Real-time Progress Indicator */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  填写进度
                </span>
                <span className="text-sm text-gray-600">
                  当前步骤: 第 {currentStep} 步
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-xs text-gray-500">完成度: {progress}%</span>
              </div>

              {/* Step Indicators */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`text-center p-3 rounded-lg border-2 transition-all ${formData?.title && formData?.author && formData?.discipline ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs font-medium ${formData?.title && formData?.author && formData?.discipline ? 'text-green-700' : 'text-gray-600'}`}>
                    ① 案例集信息
                  </div>
                </div>
                <div className={`text-center p-3 rounded-lg border-2 transition-all ${formData?.publication && formData?.publicationYear ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs font-medium ${formData?.publication && formData?.publicationYear ? 'text-green-700' : 'text-gray-600'}`}>
                    ② 发表信息
                  </div>
                </div>
                <div className={`text-center p-3 rounded-lg border-2 transition-all ${selectedFiles.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs font-medium ${selectedFiles.length > 0 ? 'text-green-700' : 'text-gray-600'}`}>
                    ③ 文件上传
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <Card className="border-2 border-gray-100 rounded-lg overflow-hidden hover:border-red-200 transition-colors">
              <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle
                  className="text-xl font-medium text-gray-900"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  案例集信息
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  请填写案例集（论文复现包）的详细信息,帮助其他研究者理解和使用您的研究成果
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      标题 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...register('title')}
                      className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="请输入案例集标题"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                      论文源作者 <span className="text-red-500">*</span>
                      <span className="text-gray-400 text-xs ml-2">(多位作者用英文分号分隔)</span>
                    </Label>
                    <Input
                      id="author"
                      {...register('author')}
                      className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="例如:张三;李四;王五"
                    />
                    {errors.author && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        {errors.author.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discipline" className="text-sm font-medium text-gray-700">
                    学科分类 <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="discipline"
                    {...register('discipline')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  >
                    <option value="">请选择学科分类</option>
                    {disciplines.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.discipline && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.discipline.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-sm font-medium text-gray-700">
                    简述 <span className="text-gray-400">(可选,最多50字符)</span>
                  </Label>
                  <Input
                    id="summary"
                    {...register('summary')}
                    maxLength={50}
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="简要描述案例集内容"
                  />
                  {errors.summary && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.summary.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Publication Information Section */}
            <Card className="border-2 border-gray-100 rounded-lg overflow-hidden hover:border-red-200 transition-colors">
              <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle
                  className="text-xl font-medium text-gray-900"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  发表信息
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  提供论文的发表信息,便于其他研究者追溯和引用
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="publication" className="text-sm font-medium text-gray-700">
                      发表期刊/来源 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="publication"
                      {...register('publication')}
                      className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="例如:中国社会科学"
                    />
                    {errors.publication && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        {errors.publication.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publicationYear" className="text-sm font-medium text-gray-700">
                      发表年份 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="publicationYear"
                      type="number"
                      {...register('publicationYear')}
                      className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="例如:2024"
                    />
                    {errors.publicationYear && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        {errors.publicationYear.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicationUrl" className="text-sm font-medium text-gray-700">
                    原文链接 <span className="text-gray-400">(可选)</span>
                  </Label>
                  <Input
                    id="publicationUrl"
                    type="url"
                    {...register('publicationUrl')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="https://example.com/article"
                  />
                  {errors.publicationUrl && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.publicationUrl.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card className="border-2 border-gray-100 rounded-lg overflow-hidden hover:border-red-200 transition-colors">
              <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle
                  className="text-xl font-medium text-gray-900"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  文件上传
                </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            支持任意文件格式，单次最多上传{MAX_FILES}个文件（可直接选择文件夹），单文件最大 1GB
          </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* File Structure Guidance */}
                <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <InfoIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-base font-medium text-gray-900 mb-3"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        案例集文件上传指南
                      </h4>
                      <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-green-100 rounded-full flex-shrink-0 mt-0.5">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium">强烈建议包含 README.md 文件:</span>
                            <span className="text-gray-600 block mt-1">
                              README.md 将在案例集详情页自动渲染,用于详细说明案例集的使用方法、复现步骤、环境要求等。支持 Markdown 格式。
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                            <VideoIcon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium">视频讲解（可选）:</span>
                            <div className="text-gray-600 mt-1 space-y-1">
                              <div>• 支持上传 <span className="font-medium text-blue-700">MP4/AVI/MOV</span> 格式的视频文件</div>
                              <div>• 视频将在案例集详情页自动播放,帮助用户更好地理解案例内容</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-purple-100 rounded-full flex-shrink-0 mt-0.5">
                            <CodeIcon className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium">建议的文件类型:</span>
                            <div className="text-gray-600 mt-1 space-y-1">
                              <div>• <span className="font-medium text-gray-700">数据文件:</span> CSV, XLSX, JSON 等</div>
                              <div>• <span className="font-medium text-gray-700">代码文件:</span> Python (.py), R (.r), Jupyter Notebook (.ipynb) 等</div>
                              <div>• <span className="font-medium text-gray-700">文档文件:</span> PDF (论文原文), DOC/DOCX 等</div>
                              <div>• <span className="font-medium text-gray-700">压缩包:</span> ZIP, RAR, 7z 等（用于批量打包）</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-amber-100 rounded-full flex-shrink-0 mt-0.5">
                            <BookOpenIcon className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-medium">文件组织建议:</span>
                            <div className="text-gray-600 mt-1 space-y-1">
                              <div>• 使用清晰的文件命名（如:<code className="bg-white px-1 py-0.5 rounded text-xs">data_preprocessing.py</code>）</div>
                              <div>• 将完整的复现材料打包在一起</div>
                              <div>• 在 README.md 中详细说明每个文件的作用和使用顺序</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* File Drop Zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all duration-300 ${
                      isDragOver
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className="mx-auto flex justify-center">
                        <div className={`p-2 sm:p-3 rounded-full ${isDragOver ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <UploadIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${isDragOver ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4">
                        <p className="text-base sm:text-lg font-medium text-gray-900">
                          {isDragOver ? '释放文件开始上传' : '拖拽文件到这里'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                        ?
                        <label className="text-red-600 hover:text-red-500 cursor-pointer font-medium">
                          <span className="ml-1">??????</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="mx-2 text-gray-300">|</span>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-500 font-medium underline-offset-2 hover:underline"
                          onClick={() => folderInputRef.current?.click()}
                        >
                          ???????
                        </button>
                        <input
                          ref={folderInputRef}
                          type="file"
                          multiple
                          onChange={handleFolderChange}
                          className="hidden"
                        />
                      </p>
                      </div>
                      <div className="mt-3 sm:mt-4 flex justify-center">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span>????????/???</span>
                        <span>?</span>
                        <span>??{MAX_FILES}???</span>
                        <span>?</span>
                        <span>?????1GB</span>
                      </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          已选择文件 ({selectedFiles.length}/{MAX_FILES})
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFiles([])}
                          className="text-red-600 hover:text-red-700"
                        >
                          清空所有
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg border ${getFileTypeStyle(file.name)}`}>
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card className="border-2 border-red-100 rounded-lg overflow-hidden bg-gradient-to-r from-red-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3
                      className="text-lg font-medium text-gray-900"
                      style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                    >
                      准备提交?
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      提交后,您的案例集将进入审核流程,通常在1-3个工作日内完成审核
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => window.history.back()}
                      className="border-2 border-gray-300 hover:bg-gray-100"
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={uploading}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 font-medium"
                    >
                      {uploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>上传中...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <UploadIcon className="h-4 w-4" />
                          <span>提交案例集</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Result Dialog */}
          <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {uploadResult?.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  {uploadResult?.success ? '上传成功' : '上传失败'}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {uploadResult && (
                  <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                      {uploadResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setShowResultDialog(false)}
                  className="w-full"
                >
                  确定
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  )
}
