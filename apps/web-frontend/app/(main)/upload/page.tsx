'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeftIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon, XIcon } from 'lucide-react'

const uploadSchema = z.object({
  name: z.string().min(1, '数据集名称不能为空'),
  catalog: z.string().min(1, '请选择数据集分类'),
  summary: z.string().max(30, '简述不能超过30个字符').optional(),
  description: z.string().min(10, '描述至少需要10个字符'),
  source: z.string().min(1, '数据来源不能为空'),
  sourceUrl: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  sourceDate: z.string().optional(),
  files: z.any().optional(), // 文件验证将在组件中处理
})

type UploadFormData = z.infer<typeof uploadSchema>

const categories = [
  '政治学',
  '经济学',
  '社会学',
  '传统与现代文化',
  '法学',
  '新闻传播',
  '计算科学',
  '数学',
  '其他'
]

export default function UploadPage() {
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
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])
    
    // 合并新文件和已选择的文件
    const allFiles = [...selectedFiles, ...newFiles]
    
    // 限制文件数量不超过10个
    if (allFiles.length > 10) {
      alert(`最多只能选择10个文件，当前已选择${selectedFiles.length}个文件，最多还能选择${10 - selectedFiles.length}个文件`)
      event.target.value = '' // 清空文件选择
      return
    }
    
    // 检查重复文件名
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
    
    // 如果有重复文件，提醒用户
    if (duplicateFiles.length > 0) {
      alert(`以下文件已存在，将跳过：\n${duplicateFiles.join('\n')}`)
    }
    
    // 更新文件列表（只添加不重复的文件）
    const finalFiles = [...selectedFiles, ...uniqueFiles]
    setSelectedFiles(finalFiles)
    
    // 清空input值，以便可以重新选择相同文件
    event.target.value = ''
  }

  // 拖拽处理
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
    
    // 合并新文件和已选择的文件
    const allFiles = [...selectedFiles, ...newFiles]
    
    // 限制文件数量不超过10个
    if (allFiles.length > 10) {
      alert(`最多只能选择10个文件，当前已选择${selectedFiles.length}个文件，最多还能选择${10 - selectedFiles.length}个文件`)
      return
    }
    
    // 检查重复文件名
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
    
    // 如果有重复文件，提醒用户
    if (duplicateFiles.length > 0) {
      alert(`以下文件已存在，将跳过：\n${duplicateFiles.join('\n')}`)
    }
    
    // 更新文件列表（只添加不重复的文件）
    const finalFiles = [...selectedFiles, ...uniqueFiles]
    setSelectedFiles(finalFiles)
  }

  // 移除单个文件
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 获取文件类型样式
  const getFileTypeStyle = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'csv': return 'bg-green-100 text-green-700 border-green-200'
      case 'xlsx': case 'xls': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pdf': return 'bg-red-100 text-red-700 border-red-200'
      case 'json': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'zip': case 'rar': case '7z': case 'tar': case 'gz': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'txt': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'doc': case 'docx': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'py': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'r': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      setUploadResult({ success: false, message: '请选择要上传的文件' })
      setShowResultDialog(true)
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('catalog', data.catalog)
      if (data.summary) {
        formData.append('summary', data.summary)
      }
      formData.append('description', data.description)
      formData.append('source', data.source)
      if (data.sourceUrl) {
        formData.append('sourceUrl', data.sourceUrl)
      }
      if (data.sourceDate) {
        formData.append('sourceDate', data.sourceDate)
      }
      
      // 添加选中的文件
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({ success: true, message: result.message })
        reset()
        setSelectedFiles([]) // 清空文件列表
      } else {
        setUploadResult({ success: false, message: result.error || '上传失败' })
      }
    } catch (error) {
      setUploadResult({ success: false, message: '网络错误，请稍后再试' })
    } finally {
      setUploading(false)
      setShowResultDialog(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full border border-red-200">
                <UploadIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">数据集上传</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              分享您的研究数据集，为学术社区贡献宝贵资源
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="p-1 bg-green-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-green-600" />
                  </div>
                  <span>支持多种格式</span>
                </div>
                <div className="flex items-center">
                  <div className="p-1 bg-blue-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>快速审核</span>
                </div>
                <div className="flex items-center">
                  <div className="p-1 bg-purple-100 rounded-full mr-2">
                    <CheckCircleIcon className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>安全存储</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>填写数据集信息</span>
              <span>第 1 步，共 3 步</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
          </div>

          {/* Basic Information Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                基本信息
              </CardTitle>
              <CardDescription>
                请填写数据集的基本信息，这些信息将帮助其他研究者更好地理解和使用您的数据。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    数据集名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="name" 
                    {...register('name')} 
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="请输入数据集名称"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catalog" className="text-sm font-medium text-gray-700">
                    数据集分类 <span className="text-red-500">*</span>
                  </Label>
                  <select 
                    id="catalog" 
                    {...register('catalog')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  >
                    <option value="">请选择数据集分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.catalog && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.catalog.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-sm font-medium text-gray-700">
                  简述 <span className="text-gray-400">(可选，最多30字符)</span>
                </Label>
                <Input 
                  id="summary" 
                  {...register('summary')} 
                  className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="简要描述数据集的主要内容"
                />
                {errors.summary && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircleIcon className="h-4 w-4" />
                    {errors.summary.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  详细描述 <span className="text-red-500">*</span>
                </Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
                  rows={4}
                  className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="请详细描述数据集的内容、用途、数据收集方法等信息..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircleIcon className="h-4 w-4" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Source Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                数据来源信息
              </CardTitle>
              <CardDescription>
                提供数据来源信息有助于其他研究者了解数据的可信度和使用条件。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                    数据来源 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="source" 
                    {...register('source')} 
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="例如：国家统计局、某研究机构等"
                  />
                  {errors.source && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="h-4 w-4" />
                      {errors.source.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceDate" className="text-sm font-medium text-gray-700">
                    数据收集日期 <span className="text-gray-400">(可选)</span>
                  </Label>
                  <Input 
                    id="sourceDate" 
                    {...register('sourceDate')} 
                    type="date"
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceUrl" className="text-sm font-medium text-gray-700">
                  数据来源URL <span className="text-gray-400">(可选)</span>
                </Label>
                <Input 
                  id="sourceUrl" 
                  {...register('sourceUrl')} 
                  type="url"
                  className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://example.com/data-source"
                />
                {errors.sourceUrl && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircleIcon className="h-4 w-4" />
                    {errors.sourceUrl.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UploadIcon className="w-5 h-5 text-purple-600" />
                </div>
                文件上传
              </CardTitle>
              <CardDescription>
                支持多种文件格式，单次最多上传10个文件。建议上传CSV、Excel、JSON等常见数据格式。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
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
                      <div className={`p-3 rounded-full ${isDragOver ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <UploadIcon className={`h-8 w-8 ${isDragOver ? 'text-red-500' : 'text-gray-400'}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-900">
                        {isDragOver ? '释放文件开始上传' : '拖拽文件到这里'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        或者 
                        <label className="text-red-600 hover:text-red-500 cursor-pointer font-medium">
                          <span className="ml-1">点击选择文件</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.zip,.rar,.7z,.py,.r,.doc,.docx"
                          />
                        </label>
                      </p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>支持格式：CSV, Excel, JSON, PDF 等</span>
                        <span>•</span>
                        <span>最多10个文件</span>
                        <span>•</span>
                        <span>单文件最大100MB</span>
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
          <Card className="shadow-lg border-0 bg-gradient-to-r from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900">准备提交？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    提交后，您的数据集将进入审核流程，通常在1-3个工作日内完成审核。
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => window.history.back()}
                    className="border border-gray-300"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-2 font-medium"
                  >
                    {uploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>上传中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UploadIcon className="h-4 w-4" />
                        <span>提交数据集</span>
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