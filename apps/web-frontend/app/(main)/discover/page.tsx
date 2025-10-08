'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Button, Card, CardBody, Input, 
  Chip, ScrollShadow, Listbox, ListboxItem
} from "@nextui-org/react";
import { ArrowLeftIcon, SearchIcon, DownloadIcon, CalendarIcon, FolderIcon, StarIcon, LinkIcon, Building2Icon } from 'lucide-react'

// 数据集类型定义
interface Dataset {
  id: string;
  name: string;
  catalog: string;
  summary?: string;
  source: string;
  sourceUrl?: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  downloadCount: number;
  enableDataAnalysis: boolean;
  enablePreview: boolean;
  isFeatured: boolean;
}

// 分类列表
const ALL_CATEGORIES = [
  '政治学', '经济学', '社会学', '传统与现代文化', '法学', 
  '新闻传播', '计算科学', '数学', '其他'
];

// 单个数据集卡片
const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
  <Card shadow="sm" isPressable onPress={() => window.location.href = `/datasets/${dataset.id}`} className="relative">
    <CardBody>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-large">{dataset.name}</h4>
          {dataset.isFeatured && (
            <Chip 
              size="sm" 
              color="warning" 
              variant="flat"
              startContent={<StarIcon className="w-3 h-3" />}
            >
              精选
            </Chip>
          )}
        </div>
        <Chip color="primary" variant="flat">{dataset.catalog}</Chip>
      </div>
      <div className="text-sm text-default-500 mt-2 line-clamp-3">
        {dataset.summary ? (
          <span>{dataset.summary}</span>
        ) : (
          <span className="text-gray-400">暂无简述</span>
        )}
      </div>
      
      {/* 来源信息 */}
      {dataset.source && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center text-sm text-default-600">
            <Building2Icon className="inline mr-1 w-4 h-4" />
            <span className="font-medium">数据集来源：</span>
            <span className="ml-1">{dataset.source}</span>
          </div>
          {dataset.sourceUrl && (
            <div className="flex items-center text-sm text-default-600">
              <LinkIcon className="inline mr-1 w-4 h-4" />
              <span className="font-medium">数据集来源地址：</span>
              <a 
                href={dataset.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                {dataset.sourceUrl}
              </a>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4 text-sm text-default-500">
        <span><CalendarIcon className="inline mr-1 w-4 h-4" />{new Date(dataset.uploadTime).toLocaleDateString()}</span>
        <span><DownloadIcon className="inline mr-1 w-4 h-4" />{dataset.downloadCount} 次下载</span>
      </div>
    </CardBody>
  </Card>
);

// 主内容组件
function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [groupedDatasets, setGroupedDatasets] = useState<Record<string, Dataset[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('catalog') || 'all');

  useEffect(() => {
    fetchDatasets();
  }, []); 

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasets/public');
      const data = await response.json();
      if (response.ok) {
        setGroupedDatasets(data.groupedDatasets || {});
      }
    } catch (error) {
      console.error('获取数据集失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredAndGroupedDatasets = useMemo(() => {
    let filteredGroups: Record<string, Dataset[]> = {};

    Object.keys(groupedDatasets).forEach(catalog => {
      if (selectedCategory !== 'all' && catalog !== selectedCategory) {
        return;
      }

      const datasets = groupedDatasets[catalog].filter((d: Dataset) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.summary && d.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (datasets.length > 0) {
        filteredGroups[catalog] = datasets;
      }
    });

    return filteredGroups;
  }, [groupedDatasets, searchTerm, selectedCategory]);

  const handleCategoryChange = (key: any) => {
    const newCategory = String(key);
    setSelectedCategory(newCategory);
    const params = new URLSearchParams(window.location.search);
    if (newCategory === 'all') {
      params.delete('catalog');
    } else {
      params.set('catalog', newCategory);
    }
    router.push(`?${params.toString()}`);
  };

  const categoryItems = [
    <ListboxItem key="all">全部</ListboxItem>,
    ...ALL_CATEGORIES.map(cat => <ListboxItem key={cat}>{cat}</ListboxItem>)
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">数据集发现</h1>
        <p className="text-muted-foreground">探索、分析和分享来自人文社科领域的数据集</p>
      </div>
      <Input
        isClearable
        placeholder="搜索所有数据集..."
        startContent={<SearchIcon />}
        value={searchTerm}
        onValueChange={setSearchTerm}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="col-span-1 md:sticky top-24 self-start">
          <Card>
            <CardBody>
              <h3 className="font-bold mb-2">分类筛选</h3>
              <Listbox
                aria-label="数据集分类"
                selectionMode="single"
                selectedKeys={new Set([selectedCategory])}
                onSelectionChange={(keys) => handleCategoryChange(Array.from(keys)[0])}
                items={categoryItems}
              >
                {(item) => item}
              </Listbox>
            </CardBody>
          </Card>
        </aside>
        
        {/* Main Content */}
        <main className="col-span-1 md:col-span-3">
          {loading ? (
            <div className="text-center py-12 text-default-500">加载中...</div>
          ) : Object.keys(filteredAndGroupedDatasets).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-default-500 mb-4">暂无符合条件的数据集</p>
              <Button as={Link} href="/upload" color="primary">上传一个数据集</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredAndGroupedDatasets).map(([catalog, datasets]) => (
                <div key={catalog}>
                  <h2 className="text-2xl font-bold mb-2">{catalog}</h2>
                  <p className="text-sm text-default-500 mb-4">{`共 ${datasets.length} 个数据集`}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {datasets.map((dataset) => (
                      <DatasetCard key={dataset.id} dataset={dataset} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// 主页面组件
export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <DiscoverPageContent />
    </Suspense>
  )
} 