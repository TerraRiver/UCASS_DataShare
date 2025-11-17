'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Chip, Tabs, Tab } from '@nextui-org/react';
import {
  DownloadIcon, FileIcon, ExternalLinkIcon,
  AlertCircleIcon, BookOpenIcon, CodeIcon,
  FolderIcon, ArrowLeftIcon, FileTextIcon
} from 'lucide-react';

interface MethodModuleFile {
  id: string;
  originalName: string;
  relativePath?: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  uploadTime: string;
}

interface MethodCategory {
  id: string;
  code: string;
  name: string;
  englishName: string;
}

interface MethodModule {
  id: string;
  code: string;
  name: string;
  englishName: string;
  summary?: string;
  category: MethodCategory;
  practiceUrl?: string;
  enablePractice: boolean;
  downloadCount: number;
  previewCount: number;
  uploadTime: string;
  files: MethodModuleFile[];
}

export default function MethodModuleDetailPage({ params }: { params: { id: string } }) {
  const [module, setModule] = useState<MethodModule | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetchModule(params.id);
  }, [params.id]);

  const fetchModule = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/methods/modules/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch method module');
      }
      const data = await response.json();
      setModule(data);

      // 自动加载 README.md
      const readmeFile = data.files?.find((file: MethodModuleFile) => {
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
      setError('获取方法模块详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReadme = async (moduleId: string, fileId: string) => {
    setReadmeLoading(true);
    try {
      const response = await fetch(`/api/methods/modules/${moduleId}/files/${fileId}`);
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
    if (!module) return;

    try {
      const response = await fetch(`/api/methods/modules/${module.id}/files/${fileId}`);
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
        fetchModule(module.id);
      }
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const handleDownloadAll = async () => {
    if (!module) return;

    setDownloadingZip(true);
    try {
      const response = await fetch(`/api/methods/modules/${module.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module.name}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        fetchModule(module.id);
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

  // 组织文件结构：按文件夹分组
  const organizeFileStructure = (files: MethodModuleFile[]) => {
    const folders: { [key: string]: MethodModuleFile[] } = {};
    const rootFiles: MethodModuleFile[] = [];

    files.forEach((file) => {
      if (file.relativePath && file.relativePath.includes('/')) {
        // 有文件夹结构
        const parts = file.relativePath.split('/');
        const folderName = parts[0]; // 取第一级文件夹名
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(file);
      } else {
        // 根目录文件
        rootFiles.push(file);
      }
    });

    return { folders, rootFiles };
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

  if (error || !module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error || '方法模块未找到'}</p>
          <Button as={Link} href="/methods" className="bg-red-600 text-white">
            返回方法模块列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white -mx-6 -mt-16"
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)'
      }}
    >
      {/* Hero Section */}
      <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* 返回按钮 */}
          <Button
            as={Link}
            href="/methods"
            variant="bordered"
            className="mb-6 border-gray-300"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            返回方法模块
          </Button>

          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-light text-gray-900 mb-6"
              style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
            >
              {module.name}
            </h1>
            <div className="h-1 w-20 bg-red-600 mb-6"></div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Chip className="bg-red-50 text-red-700 border border-red-200">
                {module.category.name}
              </Chip>
              <Chip className="bg-blue-50 text-blue-700 border border-blue-200">
                {module.code}
              </Chip>
              {module.enablePractice && (
                <Chip
                  className="bg-green-50 text-green-700 border border-green-200"
                  startContent={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                >
                  支持实操
                </Chip>
              )}
            </div>

            {/* English Name */}
            <p className="text-lg text-gray-600 mb-4 italic">
              {module.englishName}
            </p>

            {/* Summary */}
            {module.summary && (
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {module.summary}
              </p>
            )}

            {/* Category Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <FolderIcon className="w-4 h-4 mr-2" />
                <span className="font-medium">分类：</span>
                <span className="ml-2">
                  [{module.category.code}] {module.category.name} ({module.category.englishName})
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <CodeIcon className="w-4 h-4 mr-2" />
                <span className="font-medium">模块代码：</span>
                <span className="ml-2 font-mono">{module.code}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {module.files.length}
              </div>
              <div className="text-sm text-gray-600">文件数量</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {module.downloadCount}
              </div>
              <div className="text-sm text-gray-600">下载次数</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {module.previewCount || 0}
              </div>
              <div className="text-sm text-gray-600">预览次数</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center hover:border-red-200 transition-colors">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {formatFileSize(module.files.reduce((total, file) => total + file.fileSize, 0))}
              </div>
              <div className="text-sm text-gray-600">总大小</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {module.files.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingZip}
                className="bg-red-600 text-white hover:bg-red-700 px-6"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                下载全部文件
              </Button>
            )}

            {module.enablePractice && module.practiceUrl && (
              <Button
                as="a"
                href={module.practiceUrl}
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
            aria-label="方法模块详情"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-200",
              cursor: "w-full bg-red-600",
              tab: "max-w-fit px-6 h-12",
              tabContent: "group-data-[selected=true]:text-gray-900 font-medium text-gray-600"
            }}
          >
            {/* 文件列表 Tab */}
            {module.files.length > 0 && (
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
                        模块文件
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(() => {
                        const { folders, rootFiles } = organizeFileStructure(module.files);

                        return (
                          <>
                            {/* 显示文件夹 */}
                            {Object.keys(folders).map((folderName) => {
                              const folderFiles = folders[folderName];
                              const totalSize = folderFiles.reduce((sum, f) => sum + f.fileSize, 0);

                              return (
                                <div key={folderName} className="p-6">
                                  {/* 文件夹标题 */}
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                      <FolderIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900 mb-1">
                                        {folderName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {folderFiles.length} 个文件 · {formatFileSize(totalSize)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 文件夹内的文件 */}
                                  <div className="ml-12 space-y-3">
                                    {folderFiles.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-900 truncate">
                                              {file.relativePath?.split('/').slice(1).join('/') || file.originalName}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                              <span>{formatFileSize(file.fileSize)}</span>
                                              <span>•</span>
                                              <span>{file.fileType}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="bordered"
                                          className="border-gray-300"
                                          onClick={() => handleDownloadSingle(file.id, file.originalName)}
                                        >
                                          <DownloadIcon className="w-3 h-3 mr-1" /> 下载
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {/* 显示根目录文件 */}
                            {rootFiles.map((file) => (
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Tab>
            )}

            {/* README Tab */}
            {readmeContent && (
              <Tab
                key="readme"
                title={
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4" />
                    <span>README</span>
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
                        README.md
                      </h3>
                    </div>
                    <div className="p-6">
                      {readmeLoading ? (
                        <div className="flex justify-center py-12">
                          <div className="text-gray-500">加载README...</div>
                        </div>
                      ) : (
                        <div className="prose prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg max-w-none
                          prose-code:text-sm prose-code:bg-gray-100 prose-code:text-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {readmeContent}
                          </ReactMarkdown>
                        </div>
                      )}
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
