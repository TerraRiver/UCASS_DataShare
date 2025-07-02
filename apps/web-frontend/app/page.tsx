'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Database, BarChart3, Users, Download, Upload, Search, Filter, Calendar, Sparkles, TrendingUp, FileText } from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'
import { AdminOnly, AuthIndicator } from '../components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'

interface Dataset {
  id: string;
  name: string;
  source: string;
  description_markdown: string;
  data_update_time: string;
  tags: string[];
  file_type: string;
  file_size: number;
  download_count: number;
  view_count: number;
  created_at: string;
}

interface DatasetsResponse {
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

export default function HomePage() {
  const { generateAnonymousId } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  // 获取已审核数据集
  const fetchDatasets = async (page = 1, search = '', tag = '') => {
    try {
      setLoading(true);
      const response = await api.get('/datasets/public', {
        params: {
          page,
          limit: 12,
          search: search || undefined,
          tag: tag || undefined
        }
      }) as DatasetsResponse;

      setDatasets(response.datasets);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total
      });
    } catch (err: any) {
      setError('获取数据集失败');
      console.error('Failed to fetch datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSearch = () => {
    fetchDatasets(1, searchTerm, selectedTag);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    fetchDatasets(1, searchTerm, tag);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 增强的导航栏 */}
      <nav className="navbar-glass backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 fade-in">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg glow">
                <Database className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UCASS DataShare
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <button className="btn-modern glow-green">
                  <Upload className="mr-2 h-4 w-4" />
                  上传数据集
                </button>
              </Link>
              
              <AdminOnly>
                <Link 
                  href="/admin" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100"
                >
                  管理面板
                </Link>
              </AdminOnly>
              
              <AdminOnly 
                fallback={
                  <Link href="/admin/login">
                    <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 glow-purple">
                      管理员登录
                    </button>
                  </Link>
                }
              >
                <AuthIndicator />
              </AdminOnly>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full glow bounce-in">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 slide-up">
              社科大数据分享平台
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto slide-up">
              🎯 高质量数据集分享平台 • 📋 专业审核机制 • 🔍 智能搜索发现 • 📊 开放透明共享
            </p>
            
            {/* 统计信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <Card className="card-hover border-0 bg-gradient-to-br from-blue-50 to-blue-100 fade-in">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3 glow">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">{pagination.total}</div>
                  <div className="text-sm text-blue-600">数据集总数</div>
                </CardContent>
              </Card>
              
              <Card className="card-hover border-0 bg-gradient-to-br from-green-50 to-green-100 fade-in">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3 glow-green">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    {datasets.reduce((sum, d) => sum + d.download_count, 0)}
                  </div>
                  <div className="text-sm text-green-600">累计下载</div>
                </CardContent>
              </Card>
              
              <Card className="card-hover border-0 bg-gradient-to-br from-purple-50 to-purple-100 fade-in">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3 glow-purple">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">
                    {datasets.reduce((sum, d) => sum + d.view_count, 0)}
                  </div>
                  <div className="text-sm text-purple-600">总浏览量</div>
                </CardContent>
              </Card>
              
              <Card className="card-hover border-0 bg-gradient-to-br from-orange-50 to-orange-100 fade-in">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-orange-500 rounded-full w-fit mx-auto mb-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-orange-700 mb-1">
                    {(datasets.reduce((sum, d) => sum + d.file_size, 0) / (1024 * 1024 * 1024)).toFixed(1)}GB
                  </div>
                  <div className="text-sm text-orange-600">数据容量</div>
                </CardContent>
              </Card>
            </div>
            
            {/* 增强的搜索区域 */}
            <div className="max-w-2xl mx-auto slide-up">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="🔍 搜索数据集名称或描述..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="input-modern h-12 text-lg"
                    />
                  </div>
                  <Button onClick={handleSearch} className="btn-modern h-12 px-8">
                    <Search className="h-5 w-5 mr-2" />
                    搜索
                  </Button>
                </div>
                
                {selectedTag && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">当前筛选:</span>
                    <span className="tag-modern">
                      {selectedTag}
                      <button 
                        onClick={() => {setSelectedTag(''); fetchDatasets(1, searchTerm, '');}}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-12">
        {/* 管理员状态显示 */}
        <AdminOnly>
          <Alert className="mb-8 border-0 bg-gradient-to-r from-blue-50 to-purple-50 glow bounce-in">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-blue-800 font-medium">
              🎯 管理员模式已激活 - <Link href="/admin" className="underline font-semibold hover:text-purple-600 transition-colors">进入管理面板</Link>
            </AlertDescription>
          </Alert>
        </AdminOnly>

        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50 slide-up">
            <AlertDescription className="text-red-800">
              ❌ {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 数据集网格 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="p-6">
                  <div className="loading-pulse h-6 rounded mb-4"></div>
                  <div className="loading-pulse h-4 rounded mb-2"></div>
                  <div className="loading-pulse h-4 rounded w-3/4 mb-4"></div>
                  <div className="loading-pulse h-8 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Database className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无数据集</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedTag ? '没有找到匹配的数据集，试试其他搜索条件' : '还没有已审核的数据集'}
            </p>
            <Link href="/upload">
              <button className="btn-modern">
                <Upload className="mr-2 h-4 w-4" />
                成为第一个上传者
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {datasets.map((dataset, index) => (
                <Card 
                  key={dataset.id} 
                  className="card-hover border-0 bg-white/90 backdrop-blur-sm fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{getFileTypeIcon(dataset.file_type)}</span>
                        <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-1">
                          {dataset.name}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dataset.tags.slice(0, 3).map((tag, tagIndex) => (
                        <button
                          key={tagIndex}
                          onClick={() => handleTagClick(tag)}
                          className="tag-modern text-xs"
                        >
                          {tag}
                        </button>
                      ))}
                      {dataset.tags.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{dataset.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {dataset.description_markdown.replace(/[#*]/g, '').substring(0, 150)}...
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center justify-between">
                        <span>📅 更新: {formatDate(dataset.data_update_time)}</span>
                        <span>💾 {formatFileSize(dataset.file_size)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>👁️ {dataset.view_count} 次浏览</span>
                        <span>⬇️ {dataset.download_count} 次下载</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <a 
                        href={dataset.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center"
                      >
                        查看来源
                      </a>
                      <button 
                        onClick={() => window.open(`/datasets/${dataset.id}/download`, '_blank')}
                        className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 glow-green"
                      >
                        下载数据
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 增强的分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12 fade-in">
                <Button
                  onClick={() => fetchDatasets(pagination.page - 1, searchTerm, selectedTag)}
                  disabled={pagination.page === 1}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-50"
                >
                  上一页
                </Button>
                
                <div className="flex space-x-2">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => fetchDatasets(pageNum, searchTerm, selectedTag)}
                        className={pageNum === pagination.page 
                          ? "btn-modern" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => fetchDatasets(pagination.page + 1, searchTerm, selectedTag)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-50"
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="fade-in">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">UCASS DataShare</span>
              </div>
              <p className="text-gray-400 mb-4">
                中国社会科学院大学数据分享平台，致力于促进高质量数据的开放共享与学术研究。
              </p>
            </div>
            
            <div className="fade-in">
              <h3 className="text-lg font-semibold mb-4">快速链接</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/upload" className="hover:text-white transition-colors">上传数据集</Link></li>
                <li><Link href="/admin/login" className="hover:text-white transition-colors">管理员登录</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">使用指南</a></li>
                <li><a href="#" className="hover:text-white transition-colors">联系我们</a></li>
              </ul>
            </div>
            
            <div className="fade-in">
              <h3 className="text-lg font-semibold mb-4">统计信息</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex justify-between">
                  <span>数据集总数:</span>
                  <span className="text-blue-400 font-semibold">{pagination.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>累计下载:</span>
                  <span className="text-green-400 font-semibold">
                    {datasets.reduce((sum, d) => sum + d.download_count, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>总浏览量:</span>
                  <span className="text-purple-400 font-semibold">
                    {datasets.reduce((sum, d) => sum + d.view_count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 中国社会科学院大学. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
      )
  } 