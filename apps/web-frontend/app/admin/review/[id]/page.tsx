'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@nextui-org/react'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  AlertCircleIcon,
  EyeIcon,
  BarChart3Icon,
  StarIcon,
  InfoIcon,
  Settings2Icon,
  DownloadIcon,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

interface File {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  path: string
  isPreviewable: boolean
}

interface Dataset {
  id: string
  name: string
  catalog: string
  summary?: string
  description: string
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  isFeatured: boolean
  enableVisualization: boolean
  enableAnalysis: boolean
  enablePreview: boolean
  files: File[]
  source?: string;
  sourceUrl?: string;
  sourceDate?: string;
}

export default function AdminReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 状态
  const [isVisible, setIsVisible] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [enableVisualization, setEnableVisualization] = useState(false)
  const [enableAnalysis, setEnableAnalysis] = useState(false)
  const [enablePreview, setEnablePreview] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    if (params.id) {
      fetchDataset(params.id as string, token)
    }
  }, [params.id, router])

  const fetchDataset = async (id: string, token: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/datasets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDataset(data.dataset)
        setIsVisible(data.dataset.isVisible)
        setIsFeatured(data.dataset.isFeatured)
        setEnableVisualization(data.dataset.enableVisualization)
        setEnableAnalysis(data.dataset.enableAnalysis)
        setEnablePreview(data.dataset.enablePreview)
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        const errData = await response.json()
        setError(errData.error || '获取数据集详情失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (statusUpdate: Partial<Dataset>) => {
    if (!dataset) return;
    setSubmitting(true);
    
    const promise = async () => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/datasets/${dataset.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '状态更新失败');
      }

      setDataset(prev => prev ? { ...prev, ...statusUpdate } : null);
      if (statusUpdate.isVisible !== undefined) setIsVisible(statusUpdate.isVisible);
      if (statusUpdate.isFeatured !== undefined) setIsFeatured(statusUpdate.isFeatured);
      if (statusUpdate.enableVisualization !== undefined) setEnableVisualization(statusUpdate.enableVisualization);
      if (statusUpdate.enableAnalysis !== undefined) setEnableAnalysis(statusUpdate.enableAnalysis);
      if (statusUpdate.enablePreview !== undefined) setEnablePreview(statusUpdate.enablePreview);

      if (statusUpdate.isReviewed) {
         setDataset(prev => prev ? { ...prev, isReviewed: true } : null);
      }
      return { success: true };
    };

    toast.promise(promise(), {
      loading: '正在更新状态...',
      success: '数据集状态更新成功！',
      error: (err) => err.message,
    });

    setSubmitting(false);
  };

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!dataset) return;
    setSubmitting(true);

    const promise = async () => {
      if (action === 'approve') {
        await handleUpdateStatus({
          isReviewed: true,
          isVisible,
          isFeatured,
          enableVisualization,
          enableAnalysis,
          enablePreview,
        });
        return { message: '数据集已批准并发布' };
      } else { // reject
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/datasets/${dataset.id}/review`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'reject' }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '操作失败');
        }
        return await response.json();
      }
    };
    
    toast.promise(promise(), {
      loading: '正在提交审核...',
      success: (data) => {
        setTimeout(() => router.push('/admin/review'), 1500);
        return data.message;
      },
      error: (err) => err.message,
    });

    setSubmitting(false);
  };

  const handleFilePreviewChange = async (fileId: string, isPreviewable: boolean) => {
    const token = localStorage.getItem('admin_token');
    if (!dataset || !token) return;

    // Optimistic UI update
    setDataset(prev => {
      if (!prev) return null;
      return {
        ...prev,
        files: prev.files.map(f => f.id === fileId ? { ...f, isPreviewable } : f)
      };
    });

    try {
      const res = await fetch(`/api/admin/datasets/${dataset.id}/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPreviewable })
      });

      if (!res.ok) throw new Error('更新文件预览状态失败');

    } catch (err: any) {
      toast.error(err.message || '操作失败，已撤销更改');
      // Revert on failure
      setDataset(prev => {
        if (!prev) return null;
        return {
          ...prev,
          files: prev.files.map(f => f.id === fileId ? { ...f, isPreviewable: !isPreviewable } : f)
        };
      });
    }
  };

  const handleFileDownload = async (file: File) => {
    const token = localStorage.getItem('admin_token');
    if (!dataset || !token) return;

    try {
      const res = await fetch(`/api/admin/datasets/${dataset.id}/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '下载失败');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">错误: {error}</div>;
  }
  
  if (!dataset) {
    return <div className="p-8 text-center">未找到数据集</div>
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="p-4 md:p-8 space-y-6">
        <header className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            返回列表
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">数据集审核</h1>
           <div className="w-24"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{dataset.name}</CardTitle>
                <div className="text-sm text-gray-500 pt-2">{dataset.catalog}</div>
                <p className="pt-4 text-gray-700">{dataset.summary}</p>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">详细描述</h3>
                   <div className="prose max-w-full">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{dataset.description}</ReactMarkdown>
                   </div>
                </div>
                 <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">上传者:</span> {dataset.uploadedBy}</div>
                    <div><span className="font-semibold">上传时间:</span> {formatDate(dataset.uploadTime)}</div>
                    {dataset.source && <div><span className="font-semibold">数据来源:</span> {dataset.source}</div>}
                    {dataset.sourceUrl && <div><span className="font-semibold">来源链接:</span> <a href={dataset.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{dataset.sourceUrl}</a></div>}
                    {dataset.sourceDate && <div><span className="font-semibold">来源日期:</span> {formatDate(dataset.sourceDate)}</div>}
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>审核操作</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isVisible" className="flex items-center"><EyeIcon className="mr-2 h-4 w-4" />可见性</Label>
                  <Switch id="isVisible" isSelected={isVisible} onValueChange={setIsVisible} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured" className="flex items-center"><StarIcon className="mr-2 h-4 w-4" />设为精选</Label>
                  <Switch id="isFeatured" isSelected={isFeatured} onValueChange={setIsFeatured} />
                </div>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="enablePreview" className="flex items-center"><InfoIcon className="mr-2 h-4 w-4" />允许预览</Label>
                  <Switch id="enablePreview" isSelected={enablePreview} onValueChange={setEnablePreview} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableVisualization" className="flex items-center"><BarChart3Icon className="mr-2 h-4 w-4" />允许可视化</Label>
                  <Switch id="enableVisualization" isSelected={enableVisualization} onValueChange={setEnableVisualization} />
                </div>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="enableAnalysis" className="flex items-center"><Settings2Icon className="mr-2 h-4 w-4" />允许分析</Label>
                  <Switch id="enableAnalysis" isSelected={enableAnalysis} onValueChange={setEnableAnalysis} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                 <Button className="w-full" color="primary" disabled={submitting} onClick={() => handleReviewAction('approve')}>
                    <CheckCircleIcon className="mr-2 h-4 w-4"/>批准并发布
                 </Button>
                 <Button className="w-full" variant="destructive" disabled={submitting} onClick={() => handleReviewAction('reject')}>
                    <XCircleIcon className="mr-2 h-4 w-4"/>拒绝
                 </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>文件列表</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dataset.files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileTextIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm">{file.originalName}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-2">
                         {enablePreview && ['.csv', '.xls', '.xlsx'].includes(file.fileType.toLowerCase()) && (
                          <div className="flex items-center space-x-1">
                            <Label htmlFor={`preview-${file.id}`} className="text-xs">预览</Label>
                            <Switch
                              id={`preview-${file.id}`}
                              isSelected={file.isPreviewable}
                              onValueChange={(isSelected) => handleFilePreviewChange(file.id, isSelected)}
                              size="sm"
                            />
                          </div>
                         )}
                         <Button variant="ghost" size="icon" onClick={() => handleFileDownload(file)}>
                           <DownloadIcon className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  )
}