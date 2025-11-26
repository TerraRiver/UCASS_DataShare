'use client'

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Progress, Chip } from '@nextui-org/react';
import { Database, Sparkles, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalEmbeddings: number;
  byType: {
    datasets: number;
    caseStudies: number;
    methodModules: number;
  };
  coverage: {
    datasets: string;
    caseStudies: string;
    methodModules: string;
  };
}

export default function RAGManagementPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/rag/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('获取统计信息失败');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleEmbedAll = async (type: 'datasets' | 'casestudies' | 'methodmodules') => {
    const confirmMessage = type === 'datasets'
      ? '确定要向量化所有数据集吗？这可能需要一些时间。'
      : type === 'casestudies'
      ? '确定要向量化所有案例集吗？这可能需要一些时间。'
      : '确定要向量化所有方法模块吗？这可能需要一些时间。';

    if (!confirm(confirmMessage)) {
      return;
    }

    setEmbedding(true);
    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = type === 'datasets'
        ? '/api/rag/embed/all-datasets'
        : type === 'casestudies'
        ? '/api/rag/embed/all-casestudies'
        : '/api/rag/embed/all-methodmodules';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const typeName = type === 'datasets' ? '数据集' : type === 'casestudies' ? '案例集' : '方法模块';
        toast.success(`成功向量化 ${data.count} 个${typeName}`);
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || '向量化失败');
      }
    } catch (error) {
      console.error('Embedding failed:', error);
      toast.error('网络错误');
    } finally {
      setEmbedding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}>
              RAG 向量化管理
            </h1>
            <p className="text-gray-600">
              管理数据集、案例集和方法模块的向量化，用于智能搜索功能
            </p>
          </div>
          <Button
            startContent={<RefreshCw className="w-4 h-4" />}
            onClick={fetchStats}
            variant="flat"
          >
            刷新统计
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {!process.env.NEXT_PUBLIC_Qwen_API_KEY && (
        <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
          <CardBody className="p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  未配置 Qwen API 密钥
                </h3>
                <p className="text-sm text-yellow-700">
                  请在后端 .env 文件中配置 Qwen_API_KEY 以启用 RAG 功能
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">向量化总数</span>
              <Database className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats?.totalEmbeddings || 0}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">数据集</span>
              <Chip size="sm" color="danger" variant="flat">
                {stats?.coverage.datasets}
              </Chip>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats?.byType.datasets || 0}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">案例集</span>
              <Chip size="sm" color="success" variant="flat">
                {stats?.coverage.caseStudies}
              </Chip>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats?.byType.caseStudies || 0}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">方法模块</span>
              <Chip size="sm" color="primary" variant="flat">
                {stats?.coverage.methodModules}
              </Chip>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats?.byType.methodModules || 0}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Datasets Embedding */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <Database className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">数据集向量化</h3>
                <p className="text-sm text-gray-600">
                  覆盖率: {stats?.coverage.datasets}
                </p>
              </div>
            </div>

            <Progress
              value={parseInt(stats?.coverage.datasets || '0')}
              color="danger"
              className="mb-4"
            />

            <Button
              color="danger"
              startContent={<Sparkles className="w-4 h-4" />}
              onClick={() => handleEmbedAll('datasets')}
              isLoading={embedding}
              fullWidth
            >
              批量向量化所有数据集
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              已向量化 {stats?.byType.datasets} 个数据集
            </p>
          </CardBody>
        </Card>

        {/* Case Studies Embedding */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">案例集向量化</h3>
                <p className="text-sm text-gray-600">
                  覆盖率: {stats?.coverage.caseStudies}
                </p>
              </div>
            </div>

            <Progress
              value={parseInt(stats?.coverage.caseStudies || '0')}
              color="success"
              className="mb-4"
            />

            <Button
              color="success"
              startContent={<Sparkles className="w-4 h-4" />}
              onClick={() => handleEmbedAll('casestudies')}
              isLoading={embedding}
              fullWidth
            >
              批量向量化所有案例集
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              已向量化 {stats?.byType.caseStudies} 个案例集
            </p>
          </CardBody>
        </Card>

        {/* Method Modules Embedding */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">方法模块向量化</h3>
                <p className="text-sm text-gray-600">
                  覆盖率: {stats?.coverage.methodModules}
                </p>
              </div>
            </div>

            <Progress
              value={parseInt(stats?.coverage.methodModules || '0')}
              color="primary"
              className="mb-4"
            />

            <Button
              color="primary"
              startContent={<Sparkles className="w-4 h-4" />}
              onClick={() => handleEmbedAll('methodmodules')}
              isLoading={embedding}
              fullWidth
            >
              批量向量化所有方法模块
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              已向量化 {stats?.byType.methodModules} 个方法模块
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Usage Guide */}
      <Card className="mt-6 border-2 border-gray-100">
        <CardBody className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 使用说明</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 向量化后的内容可以被智能搜索功能检索</li>
            <li>• 新上传并审核通过的内容需要手动向量化</li>
            <li>• 向量化过程可能需要几分钟，请耐心等待</li>
            <li>• 每次向量化会消耗 Qwen API 配额</li>
            <li>• 建议在内容较少时进行批量向量化</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
