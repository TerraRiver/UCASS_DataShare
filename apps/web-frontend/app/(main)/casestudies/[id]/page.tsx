'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Button, Chip, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { DownloadIcon, FileIcon, ExternalLinkIcon, RocketIcon, BookOpenIcon, CalendarIcon, UserIcon, PlayCircleIcon, EyeIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CaseStudyFile {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
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
  uploadTime: string;
  files: CaseStudyFile[];
}

export default function CaseStudyDetailPage({ params }: { params: { id: string } }) {
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<CaseStudyFile | null>(null);

  useEffect(() => {
    if (!params.id) return;
    const fetchCaseStudy = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/casestudies/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch case study');
        }
        const data = await response.json();
        setCaseStudy(data);

        // 检查是否有README.md文件
        const readmeFile = data.files?.find((file: CaseStudyFile) =>
          file.originalName.toLowerCase() === 'readme.md'
        );

        if (readmeFile) {
          fetchReadme(readmeFile.id);
        }
      } catch (error) {
        console.error(error);
        setCaseStudy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseStudy();
  }, [params.id]);

  const fetchReadme = async (fileId: string) => {
    setReadmeLoading(true);
    try {
      const response = await fetch(`/api/casestudies/${params.id}/files/${fileId}`);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(type)) {
      return <PlayCircleIcon className="w-5 h-5 text-purple-600" />;
    }
    if (['.pdf'].includes(type)) {
      return <FileIcon className="w-5 h-5 text-red-600" />;
    }
    if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(type)) {
      return <FileIcon className="w-5 h-5 text-blue-600" />;
    }
    if (['.md', '.txt'].includes(type)) {
      return <FileIcon className="w-5 h-5 text-gray-600" />;
    }
    if (['.csv', '.xlsx', '.xls'].includes(type)) {
      return <FileIcon className="w-5 h-5 text-green-600" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="加载中..." />
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <p className="text-xl text-red-500">案例集未找到或已下线</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-6">
              {/* Header Section */}
              <div id="main-info" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 scroll-mt-20">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{caseStudy.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Chip color="primary" variant="flat" className="font-medium">{caseStudy.discipline}</Chip>
              </div>

              {caseStudy.summary && (
                <p className="text-gray-600 text-lg leading-relaxed mb-4">{caseStudy.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span>作者：</span>
                  <span className="font-medium text-gray-900">{caseStudy.author}</span>
                </div>

                {caseStudy.publication && (
                  <div className="flex items-center gap-1.5">
                    <BookOpenIcon className="w-4 h-4 text-gray-500" />
                    <span>期刊：</span>
                    <span className="font-medium text-gray-900">{caseStudy.publication}</span>
                    {caseStudy.publicationYear && <span>({caseStudy.publicationYear})</span>}
                  </div>
                )}

                {caseStudy.publicationUrl && (
                  <a
                    href={caseStudy.publicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                    <span>查看原文链接</span>
                  </a>
                )}

                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span>上传时间：</span>
                  <span className="font-medium text-gray-900">
                    {new Date(caseStudy.uploadTime).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-3 flex-wrap">
                {caseStudy.enablePractice && caseStudy.practiceUrl && (
                  <Button
                    as="a"
                    href={caseStudy.practiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="lg"
                    color="danger"
                    className="font-semibold shadow-md hover:shadow-lg"
                    startContent={<RocketIcon className="w-5 h-5" />}
                  >
                    线上实操环境
                  </Button>
                )}

                <Button
                  as="a"
                  href={`/api/casestudies/${caseStudy.id}/download`}
                  size="lg"
                  variant="bordered"
                  className="border-gray-300 font-semibold hover:bg-gray-50"
                  startContent={<DownloadIcon className="w-5 h-5" />}
                >
                  下载全部文件
                </Button>
              </div>
            </div>
          </div>

          {/* 文件列表 */}
          <section id="file-list" className="scroll-mt-20">
            <Card className="shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-semibold text-gray-900">文件列表</h2>
                <Chip size="sm" variant="flat" color="default">
                  {caseStudy.files.length} 个文件
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <Table
                removeWrapper
                aria-label="案例集文件列表"
                classNames={{
                  th: "bg-gray-50 text-gray-700 font-semibold",
                  td: "py-3"
                }}
              >
                <TableHeader>
                  <TableColumn>文件名</TableColumn>
                  <TableColumn>大小</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody>
                  {caseStudy.files.map((file) => (
                    <TableRow key={file.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.fileType)}
                          <span className="text-sm font-medium text-gray-900">
                            {decodeURIComponent(file.originalName)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatFileSize(file.fileSize)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isVideoFile(file.originalName) && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              startContent={<PlayCircleIcon className="w-4 h-4" />}
                              onClick={() => setSelectedVideo(file)}
                            >
                              在线观看
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="bordered"
                            className="border-gray-300"
                            startContent={<DownloadIcon className="w-4 h-4" />}
                            as="a"
                            href={`/api/casestudies/${caseStudy.id}/files/${file.id}`}
                            download={file.originalName}
                          >
                            下载
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
          </section>

          {/* 视频播放器 */}
          {selectedVideo && (
            <section id="video-player" className="scroll-mt-20">
              <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <PlayCircleIcon className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-900">视频播放</h2>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => setSelectedVideo(null)}
                  >
                    关闭
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={`/api/casestudies/${caseStudy.id}/files/${selectedVideo.id}`}
                  >
                    您的浏览器不支持视频播放。
                  </video>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  正在播放：{decodeURIComponent(selectedVideo.originalName)}
                </p>
              </CardBody>
            </Card>
            </section>
          )}

          {/* README.md 内容 */}
          <section id="casestudy-description" className="scroll-mt-20">
            {readmeContent ? (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-semibold text-gray-900">README.md</h2>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                {readmeLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="加载README..." />
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h1:text-3xl prose-h1:mb-4
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-700
                    prose-code:text-sm prose-code:bg-gray-100 prose-code:text-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
                    prose-img:rounded-lg prose-img:shadow-md prose-img:border prose-img:border-gray-200
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4
                    prose-table:text-sm prose-table:border prose-table:border-gray-200
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readmeContent}
                    </ReactMarkdown>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">案例集说明</h2>
              </CardHeader>
              <CardBody className="p-6 text-center">
                <p className="text-gray-500">
                  此案例集未包含 README.md 文件。如需了解详细信息,请下载文件查看或联系作者。
                </p>
              </CardBody>
            </Card>
          )}
          </section>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-80 w-full lg:sticky lg:top-8 lg:self-start">
            <div className="space-y-6">
              {/* Navigation Card */}
              <Card className="shadow-lg border border-gray-300 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    页面导航
                  </h3>
                </CardHeader>
                <CardBody className="p-2">
                  <nav className="space-y-1">
                    <button
                      onClick={() => document.getElementById('main-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium transition-all duration-200 rounded-lg flex items-center gap-3 group border border-transparent hover:border-red-500 hover:shadow-md"
                    >
                      <span className="text-red-500 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                      <span className="flex-1">基本信息</span>
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>

                    <button
                      onClick={() => document.getElementById('file-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium transition-all duration-200 rounded-lg flex items-center gap-3 group border border-transparent hover:border-red-500 hover:shadow-md"
                    >
                      <span className="text-red-500 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </span>
                      <span className="flex-1">文件列表</span>
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>

                    <button
                      onClick={() => document.getElementById('casestudy-description')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium transition-all duration-200 rounded-lg flex items-center gap-3 group border border-transparent hover:border-red-500 hover:shadow-md"
                    >
                      <span className="text-red-500 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </span>
                      <span className="flex-1">案例集描述</span>
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>

                    {selectedVideo && (
                      <button
                        onClick={() => document.getElementById('video-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium transition-all duration-200 rounded-lg flex items-center gap-3 group border border-transparent hover:border-red-500 hover:shadow-md"
                      >
                        <span className="text-red-500 group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </span>
                        <span className="flex-1">视频播放</span>
                        <span className="text-gray-400 group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    )}
                  </nav>
                </CardBody>
              </Card>

              {/* Quick Actions Card */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-gray-50/50 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">快速操作</h3>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                  <Button
                    as="a"
                    href={`/api/casestudies/${caseStudy.id}/download`}
                    className="w-full"
                    color="danger"
                    startContent={<DownloadIcon className="w-4 h-4" />}
                  >
                    下载全部文件
                  </Button>

                  {caseStudy.enablePractice && caseStudy.practiceUrl && (
                    <Button
                      as="a"
                      href={caseStudy.practiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                      color="secondary"
                      startContent={<RocketIcon className="w-4 h-4" />}
                    >
                      线上实操环境
                    </Button>
                  )}

                  <Button
                    onClick={() => window.print()}
                    variant="bordered"
                    className="w-full border-gray-300"
                  >
                    打印页面
                  </Button>

                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: caseStudy.title,
                          text: caseStudy.summary || '案例集',
                          url: window.location.href
                        });
                      }
                    }}
                    variant="bordered"
                    className="w-full border-gray-300"
                  >
                    分享案例集
                  </Button>
                </CardBody>
              </Card>

              {/* Case Study Info Card */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-gray-50/50 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">案例集信息</h3>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">学科分类</span>
                    <Chip color="primary" variant="flat" size="sm">{caseStudy.discipline}</Chip>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">文件数量</span>
                    <span className="text-sm font-medium text-gray-900">{caseStudy.files.length} 个</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">上传日期</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(caseStudy.uploadTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {caseStudy.enablePractice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">实操环境</span>
                      <Chip color="success" variant="flat" size="sm">支持</Chip>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}