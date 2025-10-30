'use client'

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Button, Input, Select, SelectItem, Checkbox, CheckboxGroup
} from "@nextui-org/react";
import Link from 'next/link';
import {
  SearchIcon, StarIcon, VideoIcon, ExternalLinkIcon,
  ArrowUpDown, Filter, SlidersHorizontal, BookOpenIcon,
  CalendarIcon, UserIcon, BuildingIcon
} from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  author: string;
  discipline: string;
  summary?: string;
  publication: string;
  publicationYear: number;
  uploadTime: string;
  practiceUrl?: string;
  enablePractice?: boolean;
  isFeatured?: boolean;
  hasVideo?: boolean;
  _count: { files: number };
}

const ALL_DISCIPLINES = [
  '政治学', '经济学', '社会学', '传统与现代文化', '法学',
  '新闻传播', '计算科学', '数学', '其他'
];

// 案例集卡片组件
const CaseStudyCard = ({ caseStudy }: { caseStudy: CaseStudy }) => (
  <Link
    href={`/casestudies/${caseStudy.id}`}
    className="block border-2 border-gray-100 rounded-lg p-6 hover:border-red-200 hover:shadow-lg transition-all duration-300 bg-white group"
  >
    {/* 标题和标签 */}
    <div className="mb-4">
      <h3
        className="text-xl font-medium text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2"
        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
      >
        {caseStudy.title}
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          {caseStudy.discipline}
        </span>
        {caseStudy.isFeatured && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <StarIcon className="w-3 h-3 mr-1" />
            精选案例
          </span>
        )}
        {caseStudy.hasVideo && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <VideoIcon className="w-3 h-3 mr-1" />
            讲解视频
          </span>
        )}
        {caseStudy.enablePractice && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <ExternalLinkIcon className="w-3 h-3 mr-1" />
            支持实操
          </span>
        )}
      </div>
    </div>

    {/* 简介 */}
    {caseStudy.summary && (
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {caseStudy.summary}
      </p>
    )}

    {/* 元信息 */}
    <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
      <div className="flex items-center text-sm text-gray-600">
        <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
        <span className="font-medium">作者：</span>
        <span className="ml-1">{caseStudy.author}</span>
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <BuildingIcon className="w-4 h-4 mr-2 text-gray-400" />
        <span className="font-medium">发表：</span>
        <span className="ml-1">{caseStudy.publication} ({caseStudy.publicationYear})</span>
      </div>
    </div>

    {/* 底部信息 */}
    <div className="flex justify-between items-center text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center">
          <BookOpenIcon className="w-3.5 h-3.5 mr-1" />
          {caseStudy._count.files} 个文件
        </span>
        <span className="flex items-center">
          <CalendarIcon className="w-3.5 h-3.5 mr-1" />
          {new Date(caseStudy.uploadTime).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  </Link>
);

export default function CaseStudiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allCaseStudies, setAllCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedDiscipline, setSelectedDiscipline] = useState(searchParams.get('discipline') || 'all');
  const [sortBy, setSortBy] = useState<string>('uploadTime');
  const [showFilters, setShowFilters] = useState(false);
  const [featureFilters, setFeatureFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/casestudies?all=true');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAllCaseStudies(data.caseStudies || []);
    } catch (error) {
      console.error('获取案例集失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCaseStudies = useMemo(() => {
    let filtered = allCaseStudies.filter((caseStudy) => {
      // 学科筛选
      if (selectedDiscipline !== 'all' && caseStudy.discipline !== selectedDiscipline) {
        return false;
      }

      // 搜索筛选
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          caseStudy.title.toLowerCase().includes(searchLower) ||
          caseStudy.author.toLowerCase().includes(searchLower) ||
          caseStudy.discipline.toLowerCase().includes(searchLower) ||
          (caseStudy.summary && caseStudy.summary.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // 功能筛选
      if (featureFilters.length > 0) {
        if (featureFilters.includes('featured') && !caseStudy.isFeatured) return false;
        if (featureFilters.includes('video') && !caseStudy.hasVideo) return false;
        if (featureFilters.includes('practice') && !caseStudy.enablePractice) return false;
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'uploadTime':
          return new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN');
        case 'year':
          return (b.publicationYear || 0) - (a.publicationYear || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCaseStudies, searchTerm, selectedDiscipline, sortBy, featureFilters]);

  const handleDisciplineChange = (value: string) => {
    setSelectedDiscipline(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('discipline');
    } else {
      params.set('discipline', value);
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
              案例集发现
            </h1>
            <div className="h-1 w-20 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">
              探索、学习和复现来自人文社会科学领域的经典研究案例
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <Input
              isClearable
              size="lg"
              placeholder="搜索案例集标题、作者、学科..."
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
            {/* Discipline Filter */}
            <Select
              label="学科"
              placeholder="选择学科"
              selectedKeys={[selectedDiscipline]}
              onChange={(e) => handleDisciplineChange(e.target.value)}
              className="max-w-xs"
              classNames={{
                trigger: "border-2 border-gray-200 hover:border-red-300"
              }}
              startContent={<Filter className="w-4 h-4 text-gray-400" />}
            >
              <SelectItem key="all">全部学科</SelectItem>
              {ALL_DISCIPLINES.map((discipline) => (
                <SelectItem key={discipline}>{discipline}</SelectItem>
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
              <SelectItem key="title">标题排序</SelectItem>
              <SelectItem key="year">发表年份</SelectItem>
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
              共找到 <span className="font-medium text-red-600">{filteredAndSortedCaseStudies.length}</span> 个案例集
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-100">
              <CheckboxGroup
                label="特性筛选"
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
                    精选案例
                  </span>
                </Checkbox>
                <Checkbox value="video">
                  <span className="text-sm flex items-center gap-1">
                    <VideoIcon className="w-3.5 h-3.5 text-blue-600" />
                    有讲解视频
                  </span>
                </Checkbox>
                <Checkbox value="practice">
                  <span className="text-sm flex items-center gap-1">
                    <ExternalLinkIcon className="w-3.5 h-3.5 text-green-600" />
                    支持线上实操
                  </span>
                </Checkbox>
              </CheckboxGroup>
            </div>
          )}
        </div>
      </section>

      {/* Case Studies List */}
      <section className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : filteredAndSortedCaseStudies.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-6 text-lg">暂无符合条件的案例集</p>
              <Button
                as={Link}
                href="/upload-casestudy"
                className="bg-red-600 text-white hover:bg-red-700"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                上传第一个案例集
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCaseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
