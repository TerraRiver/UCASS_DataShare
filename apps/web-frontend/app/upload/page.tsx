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
import { ArrowLeftIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'

const uploadSchema = z.object({
  name: z.string().min(1, '数据集名称不能为空'),
  catalog: z.string().min(1, '请选择数据集分类'),
  description: z.string().min(10, '描述至少需要10个字符'),
  file: z.instanceof(FileList).refine((files) => files.length > 0, '请选择要上传的文件'),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const onSubmit = async (data: UploadFormData) => {
    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('catalog', data.catalog)
      formData.append('description', data.description)
      formData.append('file', data.file[0])

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({ success: true, message: result.message })
        reset()
      } else {
        setUploadResult({ success: false, message: result.error || '上传失败' })
      }
    } catch (error) {
      setUploadResult({ success: false, message: '网络错误，请稍后再试' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            返回首页
          </Link>
          <div className="ml-6">
            <h1 className="text-2xl font-bold">数据集上传</h1>
            <p className="text-muted-foreground">上传您的研究数据集，等待管理员审核</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UploadIcon className="mr-2 h-5 w-5" />
                上传新数据集
              </CardTitle>
              <CardDescription>
                请填写完整的数据集信息。上传后需要管理员审核才能公开显示。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadResult && (
                <Alert 
                  variant={uploadResult.success ? "default" : "destructive"}
                  className="mb-6"
                >
                  {uploadResult.success ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <AlertCircleIcon className="h-4 w-4" />
                  )}
                  <AlertDescription>{uploadResult.message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">数据集名称 *</Label>
                  <Input
                    id="name"
                    placeholder="输入数据集名称"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catalog">数据集分类 *</Label>
                  <select
                    id="catalog"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('catalog')}
                  >
                    <option value="">请选择分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.catalog && (
                    <p className="text-sm text-destructive">{errors.catalog.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">数据集描述 *</Label>
                  <Textarea
                    id="description"
                    placeholder="请详细描述数据集的内容、来源、用途等信息"
                    rows={5}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">上传文件 *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.doc,.docx,.sav,.spss,.dta,.stata,.R,.py"
                    {...register('file')}
                  />
                  {errors.file && (
                    <p className="text-sm text-destructive">{errors.file.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    支持格式：CSV, Excel, JSON, TXT, PDF, Word, SPSS, Stata, R, Python等
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">上传须知</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 请确保数据集符合伦理审查要求</li>
                    <li>• 敏感信息需要提前脱敏处理</li>
                    <li>• 数据集将由管理员审核后决定是否公开</li>
                    <li>• 文件大小限制为100MB</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '上传数据集'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 