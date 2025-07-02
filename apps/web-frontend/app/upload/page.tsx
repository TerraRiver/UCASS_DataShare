'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const handleInputChange = (field: keyof UploadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    setError(null);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            📤 上传数据集
          </CardTitle>
          <p className="text-center text-gray-600">
            请填写完整的数据集信息，上传后需要管理员审核才会公开展示
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                ❌ {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ {success}
                <br />
                <span className="text-sm">3秒后自动跳转到首页...</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 数据集名称 */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                数据集名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例如：中国GDP数据集2023"
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">请使用描述性的名称，至少3个字符</p>
            </div>

            {/* 数据来源 */}
            <div>
              <Label htmlFor="source" className="text-sm font-medium">
                数据来源 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="source"
                type="url"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="https://data.stats.gov.cn/"
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">请提供数据的原始来源网址</p>
            </div>

            {/* 数据更新时间 */}
            <div>
              <Label htmlFor="data_update_time" className="text-sm font-medium">
                数据更新时间 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data_update_time"
                type="date"
                value={formData.data_update_time}
                onChange={(e) => handleInputChange('data_update_time', e.target.value)}
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">数据最后更新的日期</p>
            </div>

            {/* 详细介绍 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description_markdown" className="text-sm font-medium">
                  详细介绍 <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  disabled={isUploading}
                >
                  {previewMode ? '编辑' : '预览'}
                </Button>
              </div>
              
              {!previewMode ? (
                <Textarea
                  id="description_markdown"
                  value={formData.description_markdown}
                  onChange={(e) => handleInputChange('description_markdown', e.target.value)}
                  placeholder={`# 数据集标题

## 数据说明
详细描述数据集的内容、来源和用途...

### 数据字段
- 字段1：说明
- 字段2：说明

### 使用建议
建议的使用场景和注意事项...`}
                  className="mt-1 min-h-[200px] font-mono text-sm"
                  disabled={isUploading}
                />
              ) : (
                <div 
                  className="mt-1 min-h-[200px] p-3 border rounded-md bg-gray-50"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdownPreview(formData.description_markdown) 
                  }}
                />
              )}
              <p className="text-xs text-gray-500 mt-1">支持Markdown语法，至少10个字符</p>
            </div>

            {/* 标签 */}
            <div>
              <Label htmlFor="tags" className="text-sm font-medium">
                标签（可选）
              </Label>
              <Input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="经济, GDP, 统计数据"
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">多个标签用逗号分隔</p>
            </div>

            {/* 文件上传 */}
            <div>
              <Label htmlFor="file" className="text-sm font-medium">
                选择文件 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json,.txt"
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                支持格式：CSV, Excel, JSON, TXT（最大100MB）
              </p>
              {formData.file && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ 已选择：{formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isUploading}
                className="px-8 py-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    上传中...
                  </>
                ) : (
                  '📤 上传数据集'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 