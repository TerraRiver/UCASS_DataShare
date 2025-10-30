'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button, Card, CardBody, Input,
  Chip, Select, SelectItem, Checkbox, CheckboxGroup
} from "@nextui-org/react";
import {
  SearchIcon, DownloadIcon, CalendarIcon, StarIcon,
  LinkIcon, Building2Icon, Eye, BarChart3, SlidersHorizontal,
  ArrowUpDown, Filter
} from 'lucide-react'

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
  <Card
    shadow="none"
    isPressable
    onPress={() => window.location.href = `/datasets/${dataset.id}`}
    className="border-2 border-gray-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg group"
  >
    <CardBody className="p-6">
      {/* 标题和分类 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4
            className="text-xl font-medium text-gray-900 mb-2 group-hover:text-red-600 transition-colors"
            style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
          >
            {dataset.name}
          </h4>
          <Chip
            size="sm"
            className="bg-red-50 text-red-700 border-red-200"
            variant="flat"
          >
            {dataset.catalog}
          </Chip>
        </div>
      </div>

      {/* 简介 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {dataset.summary || '暂无简述'}
      </p>

      {/* 功能标签 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dataset.isFeatured && (
          <Chip
            size="sm"
            className="bg-amber-50 text-amber-700 border border-amber-200"
            startContent={<StarIcon className="w-3 h-3" />}
          >
            精选
          </Chip>
        )}
        {dataset.enablePreview && (
          <Chip
            size="sm"
            className="bg-blue-50 text-blue-700 border border-blue-200"
            startContent={<Eye className="w-3 h-3" />}
          >
            数据预览
          </Chip>
        )}
        {dataset.enableDataAnalysis && (
          <Chip
            size="sm"
            className="bg-green-50 text-green-700 border border-green-200"
            startContent={<BarChart3 className="w-3 h-3" />}
          >
            数据分析
          </Chip>
        )}
      </div>

      {/* 来源信息 */}
      {dataset.source && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Building2Icon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{dataset.source}</span>
          </div>
          {dataset.sourceUrl && (
            <div className="flex items-center text-sm">
              <LinkIcon className="w-4 h-4 mr-2 text-gray-400" />
              <a
                href={dataset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                访问来源
              </a>
            </div>
          )}
        </div>
      )}

      {/* 元数据 */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center">
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            {new Date(dataset.uploadTime).toLocaleDateString('zh-CN')}
          </span>
          <span className="flex items-center">
            <DownloadIcon className="w-3.5 h-3.5 mr-1" />
            {dataset.downloadCount}
          </span>
        </div>
        <span className="text-gray-400">{dataset.fileType}</span>
      </div>
    </CardBody>
  </Card>
);

// 主内容组件
function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('catalog') || 'all');
  const [sortBy, setSortBy] = useState<string>('uploadTime');
  const [showFilters, setShowFilters] = useState(false);
  const [featureFilters, setFeatureFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasets/public');
      const data = await response.json();
      if (response.ok) {
        // 将分组的数据集转换为平面数组
        const datasets: Dataset[] = [];
        Object.values(data.groupedDatasets || {}).forEach((group: any) => {
          datasets.push(...group);
        });
        setAllDatasets(datasets);
      }
    } catch (error) {
      console.error('获取数据集失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDatasets = useMemo(() => {
    let filtered = allDatasets.filter((dataset) => {
      // 分类筛选
      if (selectedCategory !== 'all' && dataset.catalog !== selectedCategory) {
        return false;
      }

      // 搜索筛选
      if (searchTerm && !(
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dataset.summary && dataset.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      )) {
        return false;
      }

      // 功能筛选
      if (featureFilters.length > 0) {
        if (featureFilters.includes('featured') && !dataset.isFeatured) return false;
        if (featureFilters.includes('preview') && !dataset.enablePreview) return false;
        if (featureFilters.includes('analysis') && !dataset.enableDataAnalysis) return false;
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'uploadTime':
          return new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime();
        case 'downloadCount':
          return b.downloadCount - a.downloadCount;
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allDatasets, searchTerm, selectedCategory, sortBy, featureFilters]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('catalog');
    } else {
      params.set('catalog', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="border-b border-gray-100 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1
              className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
            >
              数据集发现
            </h1>
            <div className="h-1 w-20 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">
              探索和分析来自人文社会科学领域的优质数据资源
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <Input
              isClearable
              size="lg"
              placeholder="搜索数据集名称或简介..."
              startContent={<SearchIcon className="text-gray-400" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              classNames={{
                input: "text-base",
                inputWrapper: "border-2 border-gray-200 hover:border-red-300 focus-within:border-red-500 transition-colors"
              }}
            />
          </div>
        </div>
      </section>

      {/* Filter and Sort Section */}
      <section className="border-b border-gray-100 py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <Select
              label="分类"
              placeholder="选择分类"
              selectedKeys={[selectedCategory]}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="max-w-xs"
              classNames={{
                trigger: "border-2 border-gray-200 hover:border-red-300"
              }}
              startContent={<Filter className="w-4 h-4 text-gray-400" />}
            >
              <SelectItem key="all">全部分类</SelectItem>
              {ALL_CATEGORIES.map((cat) => (
                <SelectItem key={cat}>{cat}</SelectItem>
              ))}
            </Select>

            {/* Sort */}
            <Select
              label="排序"
              placeholder="选择排序方式"
              selectedKeys={[sortBy]}
              onChange={(e) => setSortBy(e.target.value)}
              className="max-w-xs"
              classNames={{
                trigger: "border-2 border-gray-200 hover:border-red-300"
              }}
              startContent={<ArrowUpDown className="w-4 h-4 text-gray-400" />}
            >
              <SelectItem key="uploadTime">最新上传</SelectItem>
              <SelectItem key="downloadCount">下载最多</SelectItem>
              <SelectItem key="name">名称排序</SelectItem>
            </Select>

            {/* Feature Filters Toggle */}
            <Button
              variant={showFilters ? "solid" : "bordered"}
              color={showFilters ? "danger" : "default"}
              startContent={<SlidersHorizontal className="w-4 h-4" />}
              onPress={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-red-600" : "border-2 border-gray-200"}
            >
              高级筛选
            </Button>

            <div className="ml-auto text-sm text-gray-600">
              共找到 <span className="font-medium text-red-600">{filteredAndSortedDatasets.length}</span> 个数据集
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-100">
              <CheckboxGroup
                label="功能特性"
                orientation="horizontal"
                value={featureFilters}
                onValueChange={setFeatureFilters}
                classNames={{
                  label: "text-sm font-medium text-gray-700"
                }}
              >
                <Checkbox value="featured">
                  <span className="text-sm flex items-center gap-1">
                    <StarIcon className="w-3.5 h-3.5 text-amber-600" />
                    精选数据集
                  </span>
                </Checkbox>
                <Checkbox value="preview">
                  <span className="text-sm flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    支持数据预览
                  </span>
                </Checkbox>
                <Checkbox value="analysis">
                  <span className="text-sm flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-green-600" />
                    支持数据分析
                  </span>
                </Checkbox>
              </CheckboxGroup>
            </div>
          )}
        </div>
      </section>

      {/* Dataset List */}
      <section className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : filteredAndSortedDatasets.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-6 text-lg">暂无符合条件的数据集</p>
              <Button
                as={Link}
                href="/upload"
                className="bg-red-600 text-white hover:bg-red-700"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                上传第一个数据集
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedDatasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          )}
        </div>
      </section>
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