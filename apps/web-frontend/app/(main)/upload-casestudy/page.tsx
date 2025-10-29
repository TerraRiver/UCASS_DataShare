'use client'

import { useState } from 'react'
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
import { UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon, XIcon, BookOpenIcon } from 'lucide-react'

const caseStudySchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  author: z.string().min(1, '作者不能为空'),
  discipline: z.string().min(1, '请选择学科分类'),
  summary: z.string().max(30, '简述不能超过30个字符').optional().or(z.literal('')),
  publication: z.string().min(1, '发表期刊/来源不能为空'),
  publicationYear: z.coerce.number().min(1900, '年份不正确').max(new Date().getFullYear(), '年份不正确'),
  publicationUrl: z.string().url('请输入有效的URL').optional().or(z.literal('')),
})

type CaseStudyFormData = z.infer<typeof caseStudySchema>

const disciplines = [
  '政治学', '经济学', '社会学', '传统与现代文化', '法学',
  '新闻传播', '计算科学', '数学', '其他'
]

export default function UploadCaseStudyPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CaseStudyFormData>({
    resolver: zodResolver(caseStudySchema),
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])

    const allFiles = [...selectedFiles, ...newFiles]
    if (allFiles.length > 10) {
      alert(`最多只能选择10个文件，当前已选择${selectedFiles.length}个文件，最多还能选择${10 - selectedFiles.length}个文件`)
      event.target.value = ''
      return
    }

    const duplicateFiles: string[] = []
    const uniqueFiles: File[] = []

    newFiles.forEach(newFile => {
      const isDuplicate = selectedFiles.some(existingFile =>
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )

      if (isDuplicate) {
        duplicateFiles.push(newFile.name)
      } else {
        uniqueFiles.push(newFile)
      }
    })

    if (duplicateFiles.length > 0) {
      alert(`以下文件已存在，将跳过：\n${duplicateFiles.join('\n')}`)
    }

    const finalFiles = [...selectedFiles, ...uniqueFiles]
    setSelectedFiles(finalFiles)
    event.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const newFiles = Array.from(e.dataTransfer.files)
    const allFiles = [...selectedFiles, ...newFiles]

    if (allFiles.length > 10) {
      alert(`最多只能选择10个文件，当前已选择${selectedFiles.length}个文件，最多还能选择${10 - selectedFiles.length}个文件`)
      return
    }

    const duplicateFiles: string[] = []
    const uniqueFiles: File[] = []

    newFiles.forEach(newFile => {
      const isDuplicate = selectedFiles.some(existingFile =>
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )

      if (isDuplicate) {
        duplicateFiles.push(newFile.name)
      } else {
        uniqueFiles.push(newFile)
      }
    })

    if (duplicateFiles.length > 0) {
      alert(`以下文件已存在，将跳过：\n${duplicateFiles.join('\n')}`)
    }

    const finalFiles = [...selectedFiles, ...uniqueFiles]
    setSelectedFiles(finalFiles)
  }

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
        setUploadResult({ success: true, message: '案例集上传成功！您的案例集将在审核通过后对所有用户可见，通常在1-3个工作日内完成审核。' })
        reset()
        setSelectedFiles([])
      } else {
        setUploadResult({ success: false, message: result.error || '上传失败，请重试' })
      }
    } catch (error) {
      setUploadResult({ success: false, message: '网络错误，请稍后再试' })
    } finally {
      setUploading(false)
      setShowResultDialog(true)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full border border-blue-200">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">案例集上传</h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              分享您的论文复现资源包，促进学术研究的透明与合作
            </p>
            <div className="mt-8 flex justify-center">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="p-1 bg-green-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-green-600" />
                  </div>
                  <span>论文复现</span>
                </div>
                <div className="flex items-center">
                  <div className="p-1 bg-blue-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>学术共享</span>
                </div>
                <div className="flex items-center">
                  <div className="p-1 bg-purple-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>开源协作</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3">
              <span>填写案例集信息</span>
              <span>第 1 步，共 3 步</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: '33%' }}></div>
            </div>
          </div>

          {/* Basic Information Section */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-5 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                案例集信息
              </CardTitle>
              <CardDescription>
                请填写案例集（论文复现包）的详细信息，帮助其他研究者理解和使用您的研究成果。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    标题 <span className="text-blue-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    作者 <span className="text-blue-500">*</span>
                    <span className="text-gray-400 text-xs ml-2">(多位作者用英文分号分隔)</span>
                  </Label>
                  <Input
                    id="author"
                    {...register('author')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：张三;李四;王五"
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
                  学科分类 <span className="text-blue-500">*</span>
                </Label>
                <select
                  id="discipline"
                  {...register('discipline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                  简述 <span className="text-gray-400">(可选，最多30字符)</span>
                </Label>
                <Input
                  id="summary"
                  {...register('summary')}
                  maxLength={30}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b p-5 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                发表信息
              </CardTitle>
              <CardDescription>
                提供论文的发表信息，便于其他研究者追溯和引用。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="publication" className="text-sm font-medium text-gray-700">
                    发表期刊/来源 <span className="text-blue-500">*</span>
                  </Label>
                  <Input
                    id="publication"
                    {...register('publication')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：中国社会科学"
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
                    发表年份 <span className="text-blue-500">*</span>
                  </Label>
                  <Input
                    id="publicationYear"
                    type="number"
                    {...register('publicationYear')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：2024"
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
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b p-5 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <UploadIcon className="w-5 h-5 text-indigo-600" />
                </div>
                文件上传
              </CardTitle>
              <CardDescription>
                上传案例集包含的所有文件，如代码、数据、论文PDF等。
                <br />
                <span className="inline-flex items-center gap-1 mt-2 text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  提示：可包含README.md文件作为案例集的详细描述文档
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all duration-300 ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <div className="mx-auto flex justify-center">
                      <div className={`p-2 sm:p-3 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <UploadIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <p className="text-base sm:text-lg font-medium text-gray-900">
                        {isDragOver ? '释放文件开始上传' : '拖拽文件到这里'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        或者
                        <label className="text-blue-600 hover:text-blue-500 cursor-pointer font-medium">
                          <span className="ml-1">点击选择文件</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-4 flex justify-center">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span>支持任意格式文件</span>
                        <span>•</span>
                        <span>最多10个文件</span>
                        <span>•</span>
                        <span>单文件最大1GB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        已选择文件 ({selectedFiles.length}/10)
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles([])}
                        className="text-blue-600 hover:text-blue-700"
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
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900">准备提交？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    提交后，您的案例集将进入审核流程，通常在1-3个工作日内完成审核。
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="border border-gray-300"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-2 font-medium"
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
    </div>
  )
}
