'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import api from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  source: string;
  description_markdown: string;
  data_update_time: string;
  tags: string[];
  file_type: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  review_notes?: string;
  uploader_username?: string;
  anonymous_id?: string;
  created_at: string;
}

interface PendingDatasetsResponse {
  datasets: Dataset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  revision_required: number;
}

export default function AdminDatasetsPage() {
  const [pendingDatasets, setPendingDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ pending: 0, approved: 0, rejected: 0, revision_required: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

  // 获取待审核数据集
  const fetchPendingDatasets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/datasets/admin/pending') as PendingDatasetsResponse;
      setPendingDatasets(response.datasets);
    } catch (err: any) {
      setError('获取待审核数据集失败');
      console.error('Failed to fetch pending datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取审核统计
  const fetchStats = async () => {
    try {
      const response = await api.get('/datasets/admin/stats') as { stats: ReviewStats };
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchPendingDatasets();
    fetchStats();
  }, []);

  // 执行审核操作
  const handleReview = async (datasetId: string, action: 'approve' | 'reject' | 'require_revision') => {
    if ((action === 'reject' || action === 'require_revision') && !reviewNotes.trim()) {
      setError('拒绝或要求修改时必须填写审核意见');
      return;
    }

    try {
      setReviewingId(datasetId);
      const response = await api.put(`/datasets/admin/${datasetId}/review`, {
        action,
        notes: reviewNotes || undefined
      });

      setSuccess(response.message || '审核完成');
      setReviewNotes('');
      
      // 刷新数据
      await Promise.all([fetchPendingDatasets(), fetchStats()]);
    } catch (err: any) {
      setError(err.error || '审核操作失败');
    } finally {
      setReviewingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getFileTypeIcon = (fileType: string): string => {
    switch (fileType.toLowerCase()) {
      case 'text/csv': return '📊';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '📈';
      case 'application/json': return '📋';
      case 'text/plain': return '📝';
      default: return '📄';
    }
  };

  const renderMarkdown = (markdown: string) => {
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
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据集审核管理</h1>
          <p className="text-gray-600">审核用户上传的数据集，确保内容质量</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{stats.pending}</div>
              <div className="text-sm text-gray-600">待审核</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.approved}</div>
              <div className="text-sm text-gray-600">已批准</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejected}</div>
              <div className="text-sm text-gray-600">已拒绝</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.revision_required}</div>
              <div className="text-sm text-gray-600">需修改</div>
            </CardContent>
          </Card>
        </div>

        {/* 错误和成功提示 */}
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
            </AlertDescription>
          </Alert>
        )}

        {/* 待审核数据集列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载待审核数据集...</p>
          </div>
        ) : pendingDatasets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">太棒了！</h3>
              <p className="text-gray-600">目前没有待审核的数据集</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingDatasets.map((dataset) => (
              <Card key={dataset.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileTypeIcon(dataset.file_type)}</span>
                      <div>
                        <CardTitle className="text-lg">{dataset.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          上传者: {dataset.uploader_username || `匿名用户 (${dataset.anonymous_id})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>上传时间: {formatDate(dataset.created_at)}</div>
                      <div>文件大小: {formatFileSize(dataset.file_size)}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">数据来源</Label>
                      <p className="text-sm text-blue-600 break-all">
                        <a href={dataset.source} target="_blank" rel="noopener noreferrer">
                          {dataset.source}
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">数据更新时间</Label>
                      <p className="text-sm">{formatDate(dataset.data_update_time)}</p>
                    </div>
                  </div>

                  {/* 标签 */}
                  {dataset.tags && dataset.tags.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">标签</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {dataset.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 详细描述 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-700">详细介绍</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedDataset(expandedDataset === dataset.id ? null : dataset.id)}
                      >
                        {expandedDataset === dataset.id ? '收起' : '展开'}
                      </Button>
                    </div>
                    
                    {expandedDataset === dataset.id ? (
                      <div 
                        className="p-4 bg-gray-50 rounded-md border text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: renderMarkdown(dataset.description_markdown) 
                        }}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {dataset.description_markdown.replace(/[#*\-]/g, '').substring(0, 200)}...
                      </p>
                    )}
                  </div>

                  {/* 审核操作区域 */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">审核意见</Label>
                    <Textarea
                      placeholder="请填写审核意见（拒绝或要求修改时必填）"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="mb-4"
                      rows={3}
                    />
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReview(dataset.id, 'approve')}
                        disabled={reviewingId === dataset.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {reviewingId === dataset.id ? '处理中...' : '✅ 批准'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleReview(dataset.id, 'require_revision')}
                        disabled={reviewingId === dataset.id}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        {reviewingId === dataset.id ? '处理中...' : '📝 要求修改'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleReview(dataset.id, 'reject')}
                        disabled={reviewingId === dataset.id}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        {reviewingId === dataset.id ? '处理中...' : '❌ 拒绝'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 