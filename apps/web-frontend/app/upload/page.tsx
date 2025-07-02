'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Eye, EyeOff, FileText, Globe, Calendar, Tag, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import api from '@/lib/api';

interface UploadFormData {
  name: string;
  source: string;
  description_markdown: string;
  data_update_time: string;
  tags: string;
  file: File | null;
}

interface UploadResponse {
  message: string;
  dataset: {
    id: string;
    name: string;
    status: string;
    uploadedAt: string;
  };
}

export default function UploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UploadFormData>({
    name: '',
    source: '',
    description_markdown: '',
    data_update_time: '',
    tags: '',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: keyof UploadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData(prev => ({ ...prev, file: e.dataTransfer.files[0] }));
      setError(null);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return '请输入数据集名称';
    if (formData.name.length < 3) return '数据集名称至少3个字符';
    if (!formData.source.trim()) return '请输入数据来源';
    if (!isValidUrl(formData.source)) return '数据来源必须是有效的网址';
    if (!formData.description_markdown.trim()) return '请输入详细介绍';
    if (formData.description_markdown.length < 10) return '详细介绍至少10个字符';
    if (!formData.data_update_time) return '请选择数据更新时间';
    if (!formData.file) return '请选择要上传的文件';
    
    // 验证文件类型
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json', 'text/plain'];
    if (!allowedTypes.includes(formData.file.type)) {
      return '不支持的文件类型，请上传CSV、Excel、JSON或TXT文件';
    }
    
    // 验证文件大小（100MB）
    if (formData.file.size > 100 * 1024 * 1024) {
      return '文件大小不能超过100MB';
    }
    
    return null;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('source', formData.source);
      formDataObj.append('description_markdown', formData.description_markdown);
      formDataObj.append('data_update_time', formData.data_update_time);
      formDataObj.append('file', formData.file!);
      
      // 处理标签
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formDataObj.append('tags', JSON.stringify(tags));

      const response = await api.post('/datasets/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }) as UploadResponse;

      setSuccess(response.message);
      
      // 清空表单
      setFormData({
        name: '',
        source: '',
        description_markdown: '',
        data_update_time: '',
        tags: '',
        file: null
      });
      
      // 重置文件输入
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // 3秒后跳转到首页
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      console.error('上传失败:', err);
      setError(err.error || err.details?.[0] || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const renderMarkdownPreview = (markdown: string) => {
    // 简单的Markdown渲染
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-medium mb-1">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br/>');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 美化的导航栏 */}
      <nav className="navbar-glass backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600">返回首页</span>
            </Link>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              数据集上传
            </h1>
            <div className="w-20"></div> {/* 占位符保持平衡 */}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="card-hover border-0 bg-white/95 backdrop-blur-sm shadow-2xl fade-in">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full bounce-in">
                <Upload className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-2">
              📤 上传数据集
            </CardTitle>
            <p className="text-blue-100">
              请填写完整的数据集信息，上传后需要管理员审核才会公开展示
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 slide-up">
                <AlertDescription className="text-red-800">
                  ❌ {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 glow-green bounce-in">
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="text-green-800 font-medium">
                  ✅ {success}
                  <br />
                  <span className="text-sm">3秒后自动跳转到首页...</span>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 数据集名称 */}
              <div className="fade-in" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="name" className="flex items-center text-sm font-medium mb-2">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  数据集名称 <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入数据集的名称..."
                  className="input-modern"
                  required
                />
              </div>

              {/* 数据来源 */}
              <div className="fade-in" style={{ animationDelay: '200ms' }}>
                <Label htmlFor="source" className="flex items-center text-sm font-medium mb-2">
                  <Globe className="h-4 w-4 mr-2 text-green-600" />
                  数据来源 <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="source"
                  type="url"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  placeholder="https://example.com/data-source"
                  className="input-modern"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">请提供数据的原始来源网址</p>
              </div>

              {/* 详细介绍 */}
              <div className="fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description" className="flex items-center text-sm font-medium">
                    <FileText className="h-4 w-4 mr-2 text-purple-600" />
                    详细介绍 <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 h-auto"
                  >
                    {previewMode ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        编辑模式
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        预览模式
                      </>
                    )}
                  </Button>
                </div>
                
                {previewMode ? (
                  <div 
                    className="min-h-32 p-4 border-2 border-gray-200 rounded-lg bg-gray-50"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdownPreview(formData.description_markdown) || '<p class="text-gray-400">预览内容将在这里显示...</p>' 
                    }}
                  />
                ) : (
                  <Textarea
                    id="description"
                    value={formData.description_markdown}
                    onChange={(e) => handleInputChange('description_markdown', e.target.value)}
                    placeholder="请详细描述数据集的内容、结构、来源等信息...&#10;&#10;支持 Markdown 语法：&#10;# 一级标题&#10;## 二级标题&#10;**粗体** *斜体*&#10;- 列表项"
                    className="input-modern min-h-32"
                    required
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">支持 Markdown 语法，建议详细描述数据集的用途和特点</p>
              </div>

              {/* 数据更新时间 */}
              <div className="fade-in" style={{ animationDelay: '400ms' }}>
                <Label htmlFor="dataUpdateTime" className="flex items-center text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                  数据更新时间 <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="dataUpdateTime"
                  type="date"
                  value={formData.data_update_time}
                  onChange={(e) => handleInputChange('data_update_time', e.target.value)}
                  className="input-modern"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">数据最后更新的时间</p>
              </div>

              {/* 标签 */}
              <div className="fade-in" style={{ animationDelay: '500ms' }}>
                <Label htmlFor="tags" className="flex items-center text-sm font-medium mb-2">
                  <Tag className="h-4 w-4 mr-2 text-indigo-600" />
                  标签 <span className="text-gray-500 text-xs">(可选)</span>
                </Label>
                <Input
                  id="tags"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="社会科学, 调查数据, 统计分析"
                  className="input-modern"
                />
                <p className="text-xs text-gray-500 mt-1">用英文逗号分隔多个标签，方便用户搜索和分类</p>
              </div>

              {/* 文件上传 */}
              <div className="fade-in" style={{ animationDelay: '600ms' }}>
                <Label className="flex items-center text-sm font-medium mb-3">
                  <Upload className="h-4 w-4 mr-2 text-green-600" />
                  上传文件 <span className="text-red-500 ml-1">*</span>
                </Label>
                
                <div
                  className={`upload-zone ${dragActive ? 'dragover' : ''} ${formData.file ? 'bg-green-50 border-green-300' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls,.json,.txt"
                    className="hidden"
                    required
                  />
                  
                  {formData.file ? (
                    <div className="text-center">
                      <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-lg font-medium text-green-800 mb-2">
                        {formData.file.name}
                      </p>
                      <p className="text-sm text-green-600 mb-4">
                        {formatFileSize(formData.file.size)}
                      </p>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('file')?.click()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        重新选择文件
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="p-6 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                        <Upload className="h-12 w-12 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        拖拽文件到这里或点击选择文件
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        支持 CSV、Excel、JSON、TXT 格式，最大 100MB
                      </p>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('file')?.click()}
                        className="btn-modern"
                      >
                        选择文件
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-center pt-6 fade-in" style={{ animationDelay: '700ms' }}>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="btn-modern px-12 py-4 text-lg glow"
                >
                  {isUploading ? (
                    <>
                      <div className="loading-spinner mr-3"></div>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-3 h-5 w-5" />
                      提交数据集
                    </>
                  )}
                </Button>
              </div>

              {/* 温馨提示 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 fade-in" style={{ animationDelay: '800ms' }}>
                <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-3">
                  <Sparkles className="h-5 w-5 mr-2" />
                  温馨提示
                </h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>上传的数据集将进入审核队列，管理员会在24小时内进行审核</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>请确保数据内容真实、准确，并且具有学术研究价值</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>数据集一旦通过审核发布，将对所有用户开放下载</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>如有问题，请联系管理员</span>
                  </li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 