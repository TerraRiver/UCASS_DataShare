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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon, XIcon } from 'lucide-react'

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
    if (selectedFiles.length + newFiles.length > 10) {
      alert('最多只能上传10个文件')
      return
    }
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const newFiles = Array.from(e.dataTransfer.files)
    if (selectedFiles.length + newFiles.length > 10) {
      alert('最多只能上传10个文件')
      return
    }
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i))} ${['B', 'KB', 'MB', 'GB'][i]}`
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
        setUploadResult({ success: true, message: '案例集上传成功，等待审核' })
        reset()
        setSelectedFiles([])
      } else {
        setUploadResult({ success: false, message: result.error || '上传失败' })
      }
    } catch (error) {
      setUploadResult({ success: false, message: '网络错误' })
    } finally {
      setUploading(false)
      setShowResultDialog(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">上传案例集</h1>
        <p className="text-gray-600 mb-8">分享您的论文复现资源包，促进学术研究的透明与合作。</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>案例集信息</CardTitle>
              <CardDescription>请填写案例集（论文复现包）的详细信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">标题*</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label htmlFor="author">作者（不同作者间用英文分号作为间隔）*</Label>
                  <Input id="author" {...register('author')} />
                  {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="discipline">学科分类*</Label>
                <select id="discipline" {...register('discipline')} className="w-full p-2 border rounded">
                  <option value="">请选择分类</option>
                  {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.discipline && <p className="text-red-500 text-sm mt-1">{errors.discipline.message}</p>}
              </div>
              <div>
                <Label htmlFor="summary">简述 (可选，最多30字符)</Label>
                <Input id="summary" {...register('summary')} maxLength={30} placeholder="简要描述案例集内容" />
                {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="publication">发表期刊/来源*</Label>
                  <Input id="publication" {...register('publication')} />
                  {errors.publication && <p className="text-red-500 text-sm mt-1">{errors.publication.message}</p>}
                </div>
                <div>
                  <Label htmlFor="publicationYear">发表年份*</Label>
                  <Input id="publicationYear" type="number" {...register('publicationYear')} />
                  {errors.publicationYear && <p className="text-red-500 text-sm mt-1">{errors.publicationYear.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="publicationUrl">原文链接 (可选)</Label>
                <Input id="publicationUrl" type="url" {...register('publicationUrl')} />
                {errors.publicationUrl && <p className="text-red-500 text-sm mt-1">{errors.publicationUrl.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>文件上传</CardTitle>
              <CardDescription>上传案例集包含的所有文件，如代码、数据、论文PDF等。<br/>💡 提示：可包含README.md文件作为案例集的详细描述文档</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragOver ? 'border-blue-500' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">拖拽文件到此处，或 <label className="text-blue-500 cursor-pointer">点击上传<input type="file" multiple className="hidden" onChange={handleFileChange} /></label></p>
                <p className="text-xs text-gray-500 mt-1">最多10个文件</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium">已选择文件:</h4>
                  <ul className="mt-2 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-5 w-5 text-gray-500" />
                          <span>{file.name} ({formatFileSize(file.size)})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}><XIcon className="h-4 w-4" /></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? '上传中...' : '提交审核'}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {uploadResult?.success ? <CheckCircleIcon className="text-green-500" /> : <AlertCircleIcon className="text-red-500" />}
              上传{uploadResult?.success ? '成功' : '失败'}
            </DialogTitle>
          </DialogHeader>
          <AlertDescription>{uploadResult?.message}</AlertDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}