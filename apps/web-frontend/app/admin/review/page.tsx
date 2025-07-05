'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, CardFooter, Divider, Chip } from "@nextui-org/react";
import { CheckCircleIcon, XCircleIcon, InfoIcon, CalendarIcon, UserIcon } from 'lucide-react';

interface PendingDataset {
  id: string;
  name: string;
  catalog: string;
  uploadTime: string;
  uploadedBy: string;
  description: string;
  summary: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [pendingDatasets, setPendingDatasets] = useState<PendingDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendingDatasets = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/datasets/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_token');
          router.push('/admin/login');
          return;
        }
        throw new Error('获取待审核数据集失败');
      }

      const data = await response.json();
      setPendingDatasets(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchPendingDatasets(token);
  }, [router]);

  const handleReview = async (datasetId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/datasets/${datasetId}/review`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '审核操作失败');
      }
      
      fetchPendingDatasets(token);

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">数据集审核</h1>
      
      {pendingDatasets.length === 0 ? (
        <Card>
          <CardBody className="text-center p-8">
            <p className="text-gray-500">当前没有待审核的数据集。</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingDatasets.map((dataset) => (
            <Card key={dataset.id} shadow="sm">
              <CardHeader>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold">{dataset.name}</h2>
                  <Chip color="primary" variant="flat" className="mt-1 self-start">{dataset.catalog}</Chip>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <p className="text-gray-600 mb-4">{dataset.summary}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span><UserIcon className="inline w-4 h-4 mr-1"/>上传者: {dataset.uploadedBy}</span>
                  <span><CalendarIcon className="inline w-4 h-4 mr-1"/>上传时间: {new Date(dataset.uploadTime).toLocaleDateString()}</span>
                </div>
              </CardBody>
              <Divider />
              <CardFooter className="flex justify-end space-x-2">
                 <Button as={Link} href={`/admin/review/${dataset.id}`} variant="flat" color="default" startContent={<InfoIcon />}>
                  查看详情
                </Button>
                <Button variant="flat" color="success" onClick={() => handleReview(dataset.id, 'approve')} startContent={<CheckCircleIcon />}>
                  批准
                </Button>
                <Button variant="flat" color="danger" onClick={() => handleReview(dataset.id, 'reject')} startContent={<XCircleIcon />}>
                  拒绝
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 