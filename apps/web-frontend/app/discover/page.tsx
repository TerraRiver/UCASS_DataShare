'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeftIcon, SearchIcon, DownloadIcon, CalendarIcon, FolderIcon } from 'lucide-react'

interface Dataset {
  id: string
  name: string
  catalog: string
  description: string
  fileType: string
  fileSize: number
  uploadTime: string
  downloadCount: number
}

export default function DiscoverPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDatasets()
  }, [searchTerm])

  const fetchDatasets = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/datasets/public?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('获取数据集失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            返回首页
          </Link>
          <div className="ml-6">
            <h1 className="text-2xl font-bold">数据集发现</h1>
            <p className="text-muted-foreground">探索和发现人文社科研究数据集</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索数据集..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">暂无数据集</div>
            <Link href="/upload">
              <Button>上传第一个数据集</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="dataset-card">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderIcon className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {dataset.catalog}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{dataset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {dataset.description}
                  </CardDescription>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {formatDate(dataset.uploadTime)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {dataset.downloadCount} 次下载
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/datasets/${dataset.id}`}>
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </Link>
                      <Button size="sm">
                        <DownloadIcon className="mr-1 h-4 w-4" />
                        下载
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 