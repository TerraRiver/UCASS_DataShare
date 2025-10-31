'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Chip, Tabs, Tab } from '@nextui-org/react';
import {
  DownloadIcon, FileIcon, ExternalLinkIcon,
  CalendarIcon, UserIcon, BookOpenIcon, StarIcon,
  VideoIcon, AlertCircleIcon, CheckCircleIcon,
  BuildingIcon, TrendingUpIcon, FileTextIcon
} from 'lucide-react';

interface CaseStudyFile {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  uploadTime: string;
}

interface RelatedDataset {
  id: string;
  name: string;
  summary?: string;
}

interface CaseStudy {
  id: string;
  title: string;
  author: string;
  discipline: string;
  summary?: string;
  publication?: string;
  publicationYear?: number;
  publicationUrl?: string;
  practiceUrl?: string;
  enablePractice?: boolean;
  hasVideo?: boolean;
  isFeatured?: boolean;
  downloadCount: number;
  previewCount?: number;
  uploadTime: string;
  files: CaseStudyFile[];
  relatedDatasets?: RelatedDataset[];
}

export default function CaseStudyDetailPage({ params }: { params: { id: string } }) {
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetchCaseStudy(params.id);
  }, [params.id]);

  const fetchCaseStudy = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/casestudies/${id}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch case study');
      }
      const data = await response.json();
      setCaseStudy(data);

      // 自动加载 README.md（不区分大小写，支持多种变体）
      const readmeFile = data.files?.find((file: CaseStudyFile) => {
        const fileName = file.originalName.toLowerCase();
        return fileName === 'readme.md' ||
               fileName === 'readme.txt' ||
               fileName.endsWith('/readme.md') ||
               fileName.endsWith('\\readme.md');
      });

      if (readmeFile) {
        fetchReadme(id, readmeFile.id);
      }
    } catch (error) {
      console.error(error);
      setError('获取案例集详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReadme = async (caseStudyId: string, fileId: string) => {
    setReadmeLoading(true);
    try {
      const response = await fetch(`/api/casestudies/${caseStudyId}/files/${fileId}`);
      if (response.ok) {
        const text = await response.text();
        setReadmeContent(text);
      }
    } catch (error) {
      console.error('Failed to fetch README:', error);
    } finally {
      setReadmeLoading(false);
    }
  };

  const handleDownloadSingle = async (fileId: string, fileName: string) => {
    if (!caseStudy) return;

    try {
      const response = await fetch(`/api/casestudies/${caseStudy.id}/files/${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        fetchCaseStudy(caseStudy.id);
      }
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const handleDownloadAll = async () => {
    if (!caseStudy) return;

    setDownloadingZip(true);
    try {
      const response = await fetch(`/api/casestudies/${caseStudy.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${caseStudy.title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        fetchCaseStudy(caseStudy.id);
      }
    } catch (error) {
      console.error('下载失败:', error);
    } finally {
      setDownloadingZip(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !caseStudy) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error || '案例集未找到'}</p>
          <Button as={Link} href="/casestudies" className="bg-red-600 text-white">
            返回案例集列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mx-6 -mt-16">{/* 抵消 layout 的 padding */}
        {/* Hero Section */}
        <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1
                className="text-4xl md:text-5xl font-light text-gray-900 mb-6"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                {caseStudy.title}
              </h1>
              <div className="h-1 w-20 bg-red-600 mb-6"></div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Chip className="bg-red-50 text-red-700 border border-red-200">
                  {caseStudy.discipline}
                </Chip>
                {caseStudy.isFeatured && (
                  <Chip
                    className="bg-amber-50 text-amber-700 border border-amber-200"
                    startContent={<StarIcon className="w-3.5 h-3.5" />}
                  >
                    精选案例
                  </Chip>
                )}
                {caseStudy.hasVideo && (
                  <Chip
                    className="bg-blue-50 text-blue-700 border border-blue-200"
                    startContent={<VideoIcon className="w-3.5 h-3.5" />}
                  >
                    讲解视频
                  </Chip>
                )}
                {caseStudy.enablePractice && (
                  <Chip
                    className="bg-green-50 text-green-700 border border-green-200"
                    startContent={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                  >
                    支持实操
                  </Chip>
                )}
              </div>

              {/* Summary */}
              {caseStudy.summary && (
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {caseStudy.summary}
                </p>
              )}

              {/* Author and Publication Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span className="font-medium">作者：</span>
                  <span className="ml-2">{caseStudy.author}</span>
                </div>
                {caseStudy.publication && (
                  <div className="flex items-center text-gray-600">
                    <BuildingIcon className="w-4 h-4 mr-2" />
                    <span className="font-medium">发表：</span>
                    <span className="ml-2">
                      {caseStudy.publication}
                      {caseStudy.publicationYear && ` (${caseStudy.publicationYear})`}
                    </span>
                  </div>
                )}
                {caseStudy.publicationUrl && (
                  <div className="flex items-center">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a
                      href={caseStudy.publicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <span>查看原文文献</span>
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {caseStudy.files.length}
                </div>
                <div className="text-sm text-gray-600">文件数量</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {caseStudy.downloadCount}
                </div>
                <div className="text-sm text-gray-600">下载次数</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {caseStudy.previewCount || 0}
                </div>
                <div className="text-sm text-gray-600">预览次数</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {formatFileSize(caseStudy.files.reduce((total, file) => total + file.fileSize, 0))}
                </div>
                <div className="text-sm text-gray-600">总大小</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingZip}
                className="bg-red-600 text-white hover:bg-red-700 px-6"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                下载全部文件
              </Button>

              {caseStudy.enablePractice && caseStudy.practiceUrl && (
                <Button
                  as="a"
                  href={caseStudy.practiceUrl}
                  target="_blank"
                  className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 px-6"
                  style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                >
                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                  前往共享算力平台实操
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <Tabs
              aria-label="案例集详情"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-200",
                cursor: "w-full bg-red-600",
                tab: "max-w-fit px-6 h-12",
                tabContent: "group-data-[selected=true]:text-gray-900 font-medium text-gray-600"
              }}
            >
              {/* 文件列表 Tab */}
              <Tab
                key="files"
                title={
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    <span>文件列表</span>
                  </div>
                }
              >
                <div className="py-8">
                  <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        案例集文件
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {caseStudy.files.map((file) => (
                        <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-3 bg-red-50 rounded-lg">
                                <FileIcon className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate mb-1">
                                  {file.originalName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-4">
                                  <span>{formatFileSize(file.fileSize)}</span>
                                  <span>•</span>
                                  <span>{file.fileType}</span>
                                  <span>•</span>
                                  <span>{formatDate(file.uploadTime)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="bordered"
                                className="border-gray-300"
                                onClick={() => handleDownloadSingle(file.id, file.originalName)}
                              >
                                <DownloadIcon className="w-4 h-4 mr-1" /> 下载
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tab>

              {/* 案例描述 Tab */}
              <Tab
                key="description"
                title={
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4" />
                    <span>案例描述</span>
                  </div>
                }
              >
                <div className="py-8">
                  <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        {readmeContent ? 'README.md' : '案例集描述'}
                      </h3>
                    </div>
                    <div className="p-6">
                      {readmeLoading ? (
                        <div className="flex justify-center py-12">
                          <div className="text-gray-500">加载README...</div>
                        </div>
                      ) : readmeContent ? (
                        <div className="prose prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg max-w-none
                          prose-code:text-sm prose-code:bg-gray-100 prose-code:text-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {readmeContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-12">
                          <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>未提供案例集描述</p>
                          <p className="text-sm mt-2">上传时可包含 README.md 文件</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Tab>

              {/* 复现文献 Tab */}
              {caseStudy.publicationUrl && (
                <Tab
                  key="publication"
                  title={
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="w-4 h-4" />
                      <span>复现文献</span>
                    </div>
                  }
                >
                  <div className="py-8">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-amber-200 bg-amber-100">
                        <h3
                          className="text-xl font-medium text-gray-900 mb-2"
                          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                        >
                          原始文献信息
                        </h3>
                        <p className="text-sm text-gray-700">
                          本案例集复现了以下学术文献的研究成果
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                              <BookOpenIcon className="w-4 h-4 text-amber-900" />
                            </div>
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium mb-2">
                                {caseStudy.title}
                              </div>
                              <div className="text-gray-700 mb-2">
                                <span className="font-medium">作者：</span>{caseStudy.author}
                              </div>
                              {caseStudy.publication && (
                                <div className="text-gray-700 mb-2">
                                  <span className="font-medium">发表期刊：</span>
                                  {caseStudy.publication}
                                  {caseStudy.publicationYear && ` (${caseStudy.publicationYear})`}
                                </div>
                              )}
                              <a
                                href={caseStudy.publicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline mt-3"
                              >
                                <ExternalLinkIcon className="w-4 h-4" />
                                <span>访问原文链接</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>
              )}

              {/* 关联数据集 Tab */}
              {caseStudy.relatedDatasets && caseStudy.relatedDatasets.length > 0 && (
                <Tab
                  key="datasets"
                  title={
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="w-4 h-4" />
                      <span>关联数据集</span>
                    </div>
                  }
                >
                  <div className="py-8">
                    <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3
                          className="text-xl font-medium text-gray-900"
                          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                        >
                          本案例集使用的数据集
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid gap-4">
                          {caseStudy.relatedDatasets.map((dataset) => (
                            <Link
                              key={dataset.id}
                              href={`/datasets/${dataset.id}`}
                              className="block p-6 border-2 border-gray-100 rounded-lg hover:border-red-300 hover:shadow-lg transition-all"
                            >
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {dataset.name}
                              </h4>
                              {dataset.summary && (
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {dataset.summary}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>
              )}
            </Tabs>
          </div>
        </section>
    </div>
  );
}
