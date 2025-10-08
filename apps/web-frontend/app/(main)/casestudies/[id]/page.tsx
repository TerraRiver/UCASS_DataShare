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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部信息区 - 案例集名称、作者、期刊、分类、原文链接 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{caseStudy.title}</h1>

            {caseStudy.summary && (
              <p className="text-gray-600 mb-3">{caseStudy.summary}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">作者：</span>
                <span className="font-medium">{caseStudy.author}</span>
              </div>

              {caseStudy.publication && (
                <div className="flex items-center gap-1.5">
                  <BookOpenIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">期刊：</span>
                  <span className="font-medium">{caseStudy.publication}</span>
                  {caseStudy.publicationYear && <span className="text-gray-600">({caseStudy.publicationYear})</span>}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">学科分类：</span>
                <Chip size="sm" variant="flat" color="primary">
                  {caseStudy.discipline}
                </Chip>
              </div>

              {caseStudy.publicationUrl && (
                <a
                  href={caseStudy.publicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  <span>查看原文链接</span>
                </a>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 flex-wrap">
            {caseStudy.enablePractice && caseStudy.practiceUrl && (
              <Button
                as="a"
                href={caseStudy.practiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                startContent={<RocketIcon className="w-5 h-5" />}
              >
                线上实操环境
              </Button>
            )}

            <Button
              as="a"
              href={`/api/casestudies/${caseStudy.id}/download`}
              color="success"
              startContent={<DownloadIcon className="w-5 h-5" />}
            >
              下载全部文件
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* GitHub风格的文件列表 */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold">文件列表</h2>
                <span className="text-sm text-gray-500">{caseStudy.files.length} 个文件</span>
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
                    <TableRow key={file.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.fileType)}
                          <span className="text-sm font-medium text-blue-600">
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
                            variant="flat"
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

          {/* 视频播放器 */}
          {selectedVideo && (
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <PlayCircleIcon className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold">视频播放</h2>
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
                <p className="mt-2 text-sm text-gray-600">
                  正在播放：{decodeURIComponent(selectedVideo.originalName)}
                </p>
              </CardBody>
            </Card>
          )}

          {/* README.md 内容 */}
          {readmeContent ? (
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">README.md</h2>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                {readmeLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="加载README..." />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none
                    prose-headings:font-bold
                    prose-a:text-blue-600 hover:prose-a:text-blue-800
                    prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-table:text-sm
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readmeContent}
                    </ReactMarkdown>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <h2 className="text-lg font-semibold">案例集说明</h2>
              </CardHeader>
              <CardBody className="p-6">
                <p className="text-gray-500">
                  此案例集未包含 README.md 文件。如需了解详细信息，请下载文件查看或联系作者。
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
