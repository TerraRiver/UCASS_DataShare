'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Button, Card, CardBody, Input, Accordion, AccordionItem, 
  Chip, ScrollShadow, Listbox, ListboxItem
} from "@nextui-org/react";
import { ArrowLeftIcon, SearchIcon, DownloadIcon, CalendarIcon, FolderIcon } from 'lucide-react'

// 分类列表
const ALL_CATEGORIES = [
  '政治学', '经济学', '社会学', '传统与现代文化', '法学', 
  '新闻传播', '计算科学', '数学', '其他'
];

// 单个数据集卡片
const DatasetCard = ({ dataset }) => (
  <Card shadow="sm" isPressable onPress={() => window.location.href = `/datasets/${dataset.id}`}>
    <CardBody>
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-large">{dataset.name}</h4>
        <Chip color="primary" variant="flat">{dataset.catalog}</Chip>
      </div>
      <p className="text-sm text-default-500 mt-2">{dataset.description.substring(0, 100)}...</p>
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

  const [groupedDatasets, setGroupedDatasets] = useState({});
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
    let filteredGroups = {};

    Object.keys(groupedDatasets).forEach(catalog => {
      if (selectedCategory !== 'all' && catalog !== selectedCategory) {
        return;
      }

      const datasets = groupedDatasets[catalog].filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (datasets.length > 0) {
        filteredGroups[catalog] = datasets;
      }
    });

    return filteredGroups;
  }, [groupedDatasets, searchTerm, selectedCategory]);

  const handleCategoryChange = (key) => {
    const newCategory = key;
    setSelectedCategory(newCategory);
    const params = new URLSearchParams(window.location.search);
    if (newCategory === 'all') {
      params.delete('catalog');
    } else {
      params.set('catalog', newCategory);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button as={Link} href="/" isIconOnly variant="light">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="ml-4">
              <h1 className="text-xl font-bold">数据集发现</h1>
              <p className="text-sm text-default-500">探索和发现人文社科研究数据集</p>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <Input
              isClearable
              placeholder="搜索所有数据集..."
              startContent={<SearchIcon />}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                >
                  <ListboxItem key="all">全部</ListboxItem>
                  {ALL_CATEGORIES.map(cat => (
                    <ListboxItem key={cat}>{cat}</ListboxItem>
                  ))}
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
              <Accordion selectionMode="multiple" defaultExpandedKeys={Object.keys(filteredAndGroupedDatasets)}>
                {Object.entries(filteredAndGroupedDatasets).map(([catalog, datasets]) => (
                  <AccordionItem 
                    key={catalog} 
                    title={catalog}
                    subtitle={`${datasets.length} 个数据集`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {datasets.map((dataset) => (
                        <DatasetCard key={dataset.id} dataset={dataset} />
                      ))}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </main>
        </div>
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