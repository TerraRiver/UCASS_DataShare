'use client'

import { useState } from 'react';
import { Input, Button, Card, CardBody, Chip, Spinner } from '@nextui-org/react';
import { Sparkles, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Source {
  type: string;
  id: string;
  title: string;
  similarity: number;
}

interface ChatResponse {
  answer: string;
  sources: Source[];
}

export default function IntelligentSearch() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:30002/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '搜索失败');
      }

      const data: ChatResponse = await response.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'dataset' ? '数据集' : '案例集';
  };

  const getTypeColor = (type: string) => {
    return type === 'dataset' ? 'danger' : 'success';
  };

  const getDetailLink = (source: Source) => {
    return source.type === 'dataset'
      ? `/datasets/${source.id}`
      : `/casestudies/${source.id}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-red-600 mr-2" />
          <h1 className="text-3xl font-light text-gray-900"
              style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}>
            智能搜索助手
          </h1>
        </div>
        <p className="text-gray-600">
          使用 AI 技术帮助您快速找到相关的数据集和案例集
        </p>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="试试问我：有哪些关于社会网络分析的数据集？"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
          startContent={<Search className="w-4 h-4 text-gray-400" />}
          size="lg"
          classNames={{
            input: "text-base",
            inputWrapper: "border-2 border-gray-200 hover:border-red-300"
          }}
          disabled={loading}
        />
        <Button
          color="danger"
          onClick={handleSearch}
          isLoading={loading}
          size="lg"
          className="px-8"
          startContent={!loading && <Sparkles className="w-5 h-5" />}
        >
          {loading ? '思考中...' : '搜索'}
        </Button>
      </div>

      {/* Example Questions */}
      {!answer && !loading && (
        <Card className="mb-6 border-2 border-gray-100">
          <CardBody className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 试试这些问题：</h3>
            <div className="flex flex-wrap gap-2">
              {[
                '有哪些关于社会网络分析的数据集？',
                '如何研究选举投票行为？',
                '推荐一些教育相关的案例集',
                '有什么数据适合做收入不平等研究？'
              ].map((example, idx) => (
                <Chip
                  key={idx}
                  variant="flat"
                  className="cursor-pointer hover:bg-red-50"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-2 border-red-200 bg-red-50">
          <CardBody className="p-4">
            <p className="text-red-700">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" color="danger" />
          <span className="ml-3 text-gray-600">AI 正在为您查找相关内容...</span>
        </div>
      )}

      {/* Answer */}
      {answer && !loading && (
        <Card className="mb-6 border-2 border-gray-200">
          <CardBody className="p-6">
            <div className="flex items-center mb-4">
              <Sparkles className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-gray-900">AI 回答：</h3>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sources */}
      {sources.length > 0 && !loading && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" />
            相关资源 ({sources.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source, idx) => (
              <Link key={idx} href={getDetailLink(source)}>
                <Card
                  isPressable
                  className="border-2 border-gray-100 hover:border-red-200 hover:shadow-lg transition-all"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Chip
                        size="sm"
                        color={getTypeColor(source.type)}
                        variant="flat"
                      >
                        {getTypeLabel(source.type)}
                      </Chip>
                      <span className="text-xs text-gray-500">
                        相似度: {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {source.title}
                    </h4>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!answer && !loading && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>基于 DeepSeek AI 技术，为您提供智能搜索和问答服务</p>
        </div>
      )}
    </div>
  );
}
