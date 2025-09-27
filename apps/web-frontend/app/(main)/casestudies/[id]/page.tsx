'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Divider, Button, Chip } from "@nextui-org/react";
import { DownloadIcon, FileIcon } from 'lucide-react';

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
  description: string;
  publication: string;
  publicationYear: number;
  publicationUrl?: string;
  updateTime: string;
  files: CaseStudyFile[];
}

export default function CaseStudyDetailPage({ params }: { params: { id: string } }) {
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error(error);
        setCaseStudy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseStudy();
  }, [params.id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <p className="text-center py-12">加载中...</p>;
  if (!caseStudy) return <p className="text-center py-12 text-red-500">案例集未找到</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col items-start gap-2">
          <h1 className="text-3xl font-bold">{caseStudy.title}</h1>
          <div className="text-md text-gray-500">
            <span>{caseStudy.author}</span> | <span>{caseStudy.publication} ({caseStudy.publicationYear})</span>
          </div>
          {caseStudy.publicationUrl && (
            <a href={caseStudy.publicationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              查看原文
            </a>
          )}
        </CardHeader>
        <Divider />
        <CardBody>
          <h2 className="text-xl font-semibold mb-2">描述</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.description}</p>
          
          <Divider className="my-6" />

          <h2 className="text-xl font-semibold mb-4">包含文件 ({caseStudy.files.length})</h2>
          <ul className="space-y-3">
            {caseStudy.files.map(file => (
              <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-gray-500" />
                  <span>{file.originalName}</span>
                </div>
                <Chip variant="flat">{formatFileSize(file.fileSize)}</Chip>
              </li>
            ))}
          </ul>
        </CardBody>
        <Divider />
        <CardBody>
           <a href={`/api/casestudies/${caseStudy.id}/download`} download>
            <Button color="success" size="lg" startContent={<DownloadIcon />}>
              下载案例集 (.zip)
            </Button>
          </a>
        </CardBody>
      </Card>
    </div>
  );
}