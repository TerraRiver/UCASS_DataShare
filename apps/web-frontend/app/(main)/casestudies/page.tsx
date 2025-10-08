'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Divider, Button, Pagination, Input, Listbox, ListboxItem } from "@nextui-org/react";
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';

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
  _count: { files: number };
}

const disciplines = [
  '全部', '政治学', '经济学', '社会学', '传统与现代文化', '法学', 
  '新闻传播', '计算科学', '数学', '其他'
];

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('全部');

  useEffect(() => {
    const fetchCaseStudies = async () => {
      setLoading(true);
      try {
        const disciplineQuery = selectedDiscipline === '全部' ? '' : `&discipline=${selectedDiscipline}`;
        const response = await fetch(`/api/casestudies?page=${page}&search=${searchTerm}${disciplineQuery}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setCaseStudies(data.caseStudies);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCaseStudies();
  }, [page, searchTerm, selectedDiscipline]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">案例集发现</h1>
        <p className="text-lg text-gray-600 mt-2">探索、学习和复现来自人文社科领域的经典研究案例</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4">
          <Card>
            <CardHeader><h3 className="text-lg font-semibold">学科分类筛选</h3></CardHeader>
            <Divider/>
            <CardBody>
              <Listbox
                aria-label="Discipline Filter"
                selectionMode="single"
                selectedKeys={new Set([selectedDiscipline])}
                onSelectionChange={(keys) => setSelectedDiscipline(Array.from(keys)[0] as string)}
              >
                {disciplines.map(d => <ListboxItem key={d}>{d}</ListboxItem>)}
              </Listbox>
            </CardBody>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="w-full md:w-3/4">
          <Input
            isClearable
            placeholder="搜索案例集标题、作者、学科..."
            startContent={<SearchIcon />}
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="w-full mb-6"
          />
          {loading ? <p>加载中...</p> : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {caseStudies.length > 0 ? caseStudies.map((cs) => (
                  <Card key={cs.id} isHoverable>
                    <CardHeader>
                      <h4 className="font-bold text-large">{cs.title}</h4>
                    </CardHeader>
                    <Divider/>
                    <CardBody className="space-y-2">
                      <p className="text-sm text-gray-500"><strong>作者:</strong> {cs.author}</p>
                      <p className="text-sm text-gray-500"><strong>学科:</strong> {cs.discipline}</p>
                      <p className="text-sm text-gray-500"><strong>发表:</strong> {cs.publication} ({cs.publicationYear})</p>
                      {cs.summary && (
                        <p className="text-sm text-default-500 mt-2 line-clamp-2">{cs.summary}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">包含 {cs._count.files} 个文件</p>
                    </CardBody>
                    <Divider/>
                    <CardFooter>
                      <Button as={Link} href={`/casestudies/${cs.id}`} fullWidth color="primary" variant="flat">
                        查看详情
                      </Button>
                    </CardFooter>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-500">未找到符合条件的案例集。</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-8">
                <Pagination isCompact showControls total={totalPages} page={page} onChange={setPage} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}