'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Eye, EyeOff, Sparkles, TrendingUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
  created_at: string;
  upload_user_id: string;
  review_notes?: string;
}

interface AdminStats {
  pending: number;
  approved: number;
  rejected: number;
  revision_required: number;
}

export default function AdminDatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<AdminStats>({ pending: 0, approved: 0, rejected: 0, revision_required: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingDatasets();
    fetchStats();
  }, []);

  const fetchPendingDatasets = async () => {
    try {
      const response = await api.get('/datasets/admin/pending');
      setDatasets(response.data?.datasets || []);
    } catch (err: any) {
      setError('获取待审核数据集失败');
      console.error('Failed to fetch pending datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/datasets/admin/stats');
      setStats(response.data?.stats || { pending: 0, approved: 0, rejected: 0, revision_required: 0 });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleReview = async (datasetId: string, decision: 'approved' | 'rejected' | 'revision_required') => {
    try {
      setReviewingId(datasetId);
      setError(null);

      await api.put(`/datasets/admin/${datasetId}/review`, {
        decision,
        review_notes: reviewNotes.trim() || undefined
      });

      setSuccess(`数据集已${decision === 'approved' ? '批准' : decision === 'rejected' ? '拒绝' : '要求修改'}`);
      
      // 重新加载数据
      fetchPendingDatasets();
      fetchStats();
      
      // 清空审核备注
      setReviewNotes('');
      
      // 3秒后清空成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '审核操作失败');
    } finally {
      setReviewingId(null);
    }
  };

  const toggleDescription = (datasetId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(datasetId)) {
      newExpanded.delete(datasetId);
    } else {
      newExpanded.add(datasetId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMarkdown = (markdown: string, isExpanded: boolean): string => {
    const processed = markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mb-2 text-gray-800">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-semibold mb-2 text-gray-700">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-medium mb-1 text-gray-600">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-gray-600">• $1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="text-gray-800">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="text-gray-700">$1</em>')
      .replace(/\n/gim, '<br/>');
    
    if (!isExpanded && processed.length > 200) {
      return processed.substring(0, 200) + '...';
    }
    return processed;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'revision_required': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '已批准';
      case 'rejected': return '已拒绝';
      case 'revision_required': return '需修改';
      default: return '未知';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* 头部区域 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="fade-in">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-full bounce-in">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">数据集审核管理</h1>
                    <p className="text-indigo-100">审核和管理平台上的数据集</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => { fetchPendingDatasets(); fetchStats(); }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover border-0 bg-gradient-to-br from-yellow-50 to-orange-100 fade-in">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-yellow-500 rounded-full w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-yellow-700 mb-1">{stats.pending}</div>
                <div className="text-sm text-yellow-600">待审核</div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 bg-gradient-to-br from-green-50 to-emerald-100 fade-in">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3 glow-green">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">{stats.approved}</div>
                <div className="text-sm text-green-600">已批准</div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 bg-gradient-to-br from-red-50 to-pink-100 fade-in">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-red-500 rounded-full w-fit mx-auto mb-3">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-red-700 mb-1">{stats.rejected}</div>
                <div className="text-sm text-red-600">已拒绝</div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 bg-gradient-to-br from-orange-50 to-amber-100 fade-in">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-orange-500 rounded-full w-fit mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-1">{stats.revision_required}</div>
                <div className="text-sm text-orange-600">需修改</div>
              </CardContent>
            </Card>
          </div>

          {/* 消息提示 */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 slide-up">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 glow-green bounce-in">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* 待审核数据集列表 */}
          {loading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="card-hover">
                  <CardContent className="p-6">
                    <div className="loading-pulse h-6 rounded mb-4"></div>
                    <div className="loading-pulse h-4 rounded mb-2"></div>
                    <div className="loading-pulse h-20 rounded mb-4"></div>
                    <div className="loading-pulse h-8 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <Card className="border-0 bg-white/90 backdrop-blur-sm fade-in">
              <CardContent className="p-12 text-center">
                <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto mb-6">
                  <CheckCircle className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无待审核数据集</h3>
                <p className="text-gray-500">所有数据集都已处理完毕</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {datasets.map((dataset, index) => (
                <Card 
                  key={dataset.id} 
                  className="card-hover border-0 bg-white/95 backdrop-blur-sm fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(dataset.status)}
                          <CardTitle className="text-xl text-gray-800">{dataset.name}</CardTitle>
                          <span className={`status-indicator ${dataset.status === 'pending' ? 'status-pending' : ''}`}>
                            {getStatusText(dataset.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {dataset.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag-modern text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 左侧：基本信息 */}
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">数据来源</h4>
                          <a 
                            href={dataset.source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                          >
                            {dataset.source}
                          </a>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-700">详细介绍</h4>
                            <Button
                              onClick={() => toggleDescription(dataset.id)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 h-auto"
                            >
                              {expandedDescriptions.has(dataset.id) ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  收起
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  展开
                                </>
                              )}
                            </Button>
                          </div>
                          <div 
                            className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg"
                            dangerouslySetInnerHTML={{ 
                              __html: renderMarkdown(
                                dataset.description_markdown, 
                                expandedDescriptions.has(dataset.id)
                              ) 
                            }}
                          />
                        </div>

                        {/* 审核备注输入 */}
                        {dataset.status === 'pending' && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">审核意见</h4>
                            <Textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="请填写审核意见（拒绝或要求修改时必填）..."
                              className="input-modern min-h-20"
                            />
                          </div>
                        )}
                      </div>

                      {/* 右侧：元数据和操作 */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            数据集信息
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-600">文件类型:</span>
                              <span className="text-blue-800 font-medium">{dataset.file_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">文件大小:</span>
                              <span className="text-blue-800 font-medium">{formatFileSize(dataset.file_size)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">数据更新:</span>
                              <span className="text-blue-800 font-medium">
                                {new Date(dataset.data_update_time).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">上传时间:</span>
                              <span className="text-blue-800 font-medium">{formatDate(dataset.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 审核操作按钮 */}
                        {dataset.status === 'pending' && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">审核操作</h4>
                            <div className="grid grid-cols-1 gap-2">
                              <Button
                                onClick={() => handleReview(dataset.id, 'approved')}
                                disabled={reviewingId === dataset.id}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white glow-green"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                批准发布
                              </Button>
                              
                              <Button
                                onClick={() => handleReview(dataset.id, 'revision_required')}
                                disabled={reviewingId === dataset.id || !reviewNotes.trim()}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                要求修改
                              </Button>
                              
                              <Button
                                onClick={() => handleReview(dataset.id, 'rejected')}
                                disabled={reviewingId === dataset.id || !reviewNotes.trim()}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                拒绝发布
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              💡 拒绝或要求修改时必须填写审核意见
                            </p>
                          </div>
                        )}

                        {/* 已审核的显示审核信息 */}
                        {dataset.status !== 'pending' && dataset.review_notes && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2">审核意见</h4>
                            <p className="text-sm text-gray-600">{dataset.review_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 