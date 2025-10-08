'use client'

import { useState, useEffect, useCallback, useMemo, Key, FC } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeftIcon,
  SearchIcon,
  EyeIcon,
  TrashIcon,
  EditIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  RocketIcon
} from 'lucide-react'
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Spinner, Chip, Tooltip, Selection, SortDescriptor,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Input, Textarea, Button
} from "@nextui-org/react"

interface CaseStudy {
  id: string
  title: string
  author: string
  discipline: string
  summary?: string
  publication?: string
  publicationYear?: number
  publicationUrl?: string
  practiceUrl?: string
  uploadTime: string
  uploadedBy?: string
  isReviewed: boolean
  isVisible: boolean
  isFeatured?: boolean
  enablePractice?: boolean
  downloadCount: number
  _count: { files: number }
}

type StatusColor = "success" | "warning" | "default"

const STATUS_OPTIONS = [
  {name: "全部", uid: "all"},
  {name: "待审核", uid: "pending"},
  {name: "已上线", uid: "approved"},
  {name: "已隐藏", uid: "hidden"},
];

const STATUS_COLOR_MAP: Record<string, StatusColor> = {
  approved: "success",
  pending: "warning",
  hidden: "default",
};

const DISCIPLINES = [
  '政治学',
  '经济学',
  '社会学',
  '传统与现代文化',
  '法学',
  '新闻传播',
  '计算科学',
  '数学',
  '其他'
];

const CaseStudyManagementPage: FC = () => {
  const router = useRouter()
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Selection>(new Set(["all"]))
  const [page, setPage] = useState(1)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "uploadTime",
    direction: "descending",
  });

  // Modal states
  const {isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange} = useDisclosure();
  const {isOpen: isReviewOpen, onOpen: onReviewOpen, onOpenChange: onReviewOpenChange} = useDisclosure();
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);

  const handleEditClick = (caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    onEditOpen();
  };

  const handleReviewClick = (caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    onReviewOpen();
  };

  const handleUpdateCaseStudy = async () => {
    if (!selectedCaseStudy) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const { id, _count, uploadTime, downloadCount, ...dataToUpdate } = selectedCaseStudy;

      const response = await fetch(`/api/admin/casestudies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }

      await fetchData();
      onEditOpenChange();
    } catch (error: any) {
      console.error('Failed to update case study:', error);
      alert(`更新失败: ${error.message}`);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedCaseStudy) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/casestudies/${selectedCaseStudy.id}/review`, {
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

      await fetchData();
      onReviewOpenChange();
    } catch (err: any) {
      alert(`审核失败: ${err.message}`);
    }
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/casestudies?limit=10000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_token')
          router.push('/admin/login')
        }
        throw new Error('获取数据失败')
      }

      const data = await res.json()
      setCaseStudies(data.caseStudies || [])
    } catch (error) {
      console.error("获取案例集失败:", error)
      setCaseStudies([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = useCallback(async (id: string) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')
    if (!confirm('确定要删除这个案例集吗？此操作不可逆！')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/casestudies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        await fetchData()
      } else {
        const err = await response.json()
        alert(`删除失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('删除时发生网络错误')
    } finally {
      setLoading(false)
    }
  }, [router, fetchData])

  const handleToggleVisibility = useCallback(async (caseStudy: CaseStudy) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/casestudies/${caseStudy.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !caseStudy.isVisible }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        const err = await response.json()
        alert(`切换可见性失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换可见性时发生网络错误')
    }
  }, [router, fetchData])

  const handleToggleFeatured = useCallback(async (caseStudy: CaseStudy) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/casestudies/${caseStudy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: !caseStudy.isFeatured }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        const err = await response.json()
        alert(`切换精选状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换精选状态时发生网络错误')
    }
  }, [router, fetchData])

  const handleTogglePractice = useCallback(async (caseStudy: CaseStudy) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/casestudies/${caseStudy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enablePractice: !caseStudy.enablePractice }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        const err = await response.json()
        alert(`切换实操状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换实操状态时发生网络错误')
    }
  }, [router, fetchData])

  const filteredCaseStudies = useMemo(() => {
    let filtered = [...caseStudies];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(cs =>
        cs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.discipline.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    const statusFilterValue = Array.from(statusFilter)[0];
    if (statusFilterValue && statusFilterValue !== "all") {
      filtered = filtered.filter(cs => {
        const status = cs.isReviewed ? (cs.isVisible ? 'approved' : 'hidden') : 'pending';
        return status === statusFilterValue;
      });
    }

    // 排序
    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const first = a[sortDescriptor.column as keyof CaseStudy];
        const second = b[sortDescriptor.column as keyof CaseStudy];

        // 处理可能的 undefined 值
        if (first === undefined && second === undefined) return 0;
        if (first === undefined) return 1;
        if (second === undefined) return -1;

        const cmp = first < second ? -1 : first > second ? 1 : 0;
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }

    return filtered;
  }, [caseStudies, searchTerm, statusFilter, sortDescriptor]);

  const pendingCount = caseStudies.filter(cs => !cs.isReviewed).length;

  const renderCell = useCallback((caseStudy: CaseStudy, columnKey: Key) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/casestudies/${caseStudy.id}`}
              target="_blank"
              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              {caseStudy.title}
              <ExternalLinkIcon className="w-3 h-3" />
            </Link>
            <p className="text-xs text-gray-500 line-clamp-1">{caseStudy.author}</p>
          </div>
        );
      case "discipline":
        return <Chip size="sm" variant="flat" color="primary">{caseStudy.discipline}</Chip>;
      case "status":
        const currentStatus = caseStudy.isReviewed ? (caseStudy.isVisible ? 'approved' : 'hidden') : 'pending';
        return (
          <Chip color={STATUS_COLOR_MAP[currentStatus]} size="sm" variant="flat">
            {STATUS_OPTIONS.find(s => s.uid === currentStatus)?.name}
          </Chip>
        );
      case "uploadTime":
        return (
          <div className="flex flex-col text-sm">
            <span>{new Date(caseStudy.uploadTime).toLocaleDateString('zh-CN')}</span>
            <span className="text-xs text-gray-500">{caseStudy.uploadedBy}</span>
          </div>
        );
      case "stats":
        return (
          <div className="flex flex-col text-xs text-gray-600">
            <span>下载: {caseStudy.downloadCount}</span>
            <span>文件: {caseStudy._count.files}</span>
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {!caseStudy.isReviewed && (
              <Tooltip content="审核此案例集">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="warning"
                  onClick={() => handleReviewClick(caseStudy)}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            <Tooltip content="编辑案例集详细信息">
              <Button isIconOnly size="sm" variant="light" onClick={() => handleEditClick(caseStudy)}>
                <EditIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={caseStudy.isVisible ? "隐藏案例集（用户不可见）" : "显示案例集（用户可见）"}>
              <Button
                isIconOnly
                size="sm"
                variant={caseStudy.isVisible ? "flat" : "light"}
                color={caseStudy.isVisible ? "success" : "default"}
                onClick={() => handleToggleVisibility(caseStudy)}
              >
                <EyeIcon className={`w-4 h-4 ${caseStudy.isVisible ? 'text-green-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={caseStudy.isFeatured ? "取消精选标记" : "标记为精选案例集"}>
              <Button
                isIconOnly
                size="sm"
                variant={caseStudy.isFeatured ? "flat" : "light"}
                color={caseStudy.isFeatured ? "warning" : "default"}
                onClick={() => handleToggleFeatured(caseStudy)}
              >
                <StarIcon className={`w-4 h-4 ${caseStudy.isFeatured ? 'text-yellow-500' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={caseStudy.enablePractice ? "禁用线上实操" : "启用线上实操"}>
              <Button
                isIconOnly
                size="sm"
                variant={caseStudy.enablePractice ? "flat" : "light"}
                color={caseStudy.enablePractice ? "secondary" : "default"}
                onClick={() => handleTogglePractice(caseStudy)}
              >
                <RocketIcon className={`w-4 h-4 ${caseStudy.enablePractice ? 'text-purple-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="永久删除案例集">
              <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(caseStudy.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        const value = caseStudy[columnKey as keyof CaseStudy];
        return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    }
  }, [handleEditClick, handleReviewClick, handleToggleVisibility, handleToggleFeatured, handleTogglePractice, handleDelete]);

  const columns = [
    {name: "案例集标题", uid: "title"},
    {name: "学科分类", uid: "discipline"},
    {name: "状态", uid: "status"},
    {name: "上传信息", uid: "uploadTime"},
    {name: "统计", uid: "stats"},
    {name: "操作", uid: "actions"},
  ];

  return (
    <>
      <div className="p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="light" size="sm" isIconOnly>
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">案例集管理</h1>
              <p className="text-sm text-gray-500 mt-1">管理所有案例集，包括审核、编辑和发布</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Chip color="warning" variant="flat" size="lg">
              {pendingCount} 个待审核
            </Chip>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">总案例集</div>
              <div className="text-2xl font-bold text-gray-900">{caseStudies.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">待审核</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">已上线</div>
              <div className="text-2xl font-bold text-green-600">
                {caseStudies.filter(cs => cs.isReviewed && cs.isVisible).length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">总下载量</div>
              <div className="text-2xl font-bold text-blue-600">
                {caseStudies.reduce((sum, cs) => sum + cs.downloadCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            isClearable
            className="flex-1"
            placeholder="搜索案例集标题、作者或学科..."
            startContent={<SearchIcon className="w-4 h-4" />}
            value={searchTerm}
            onClear={() => setSearchTerm("")}
            onValueChange={setSearchTerm}
          />
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat">
                筛选状态
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectedKeys={statusFilter}
              selectionMode="single"
              onSelectionChange={setStatusFilter}
            >
              {STATUS_OPTIONS.map((status) => (
                <DropdownItem key={status.uid}>
                  {status.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table
              aria-label="案例集管理列表"
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.uid === "uploadTime" || column.uid === "title"}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"没有找到案例集"}
                items={filteredCaseStudies}
                isLoading={loading}
                loadingContent={<Spinner label="加载中..." />}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">编辑案例集</h3>
                <p className="text-sm font-normal text-gray-500">修改案例集的详细信息</p>
              </ModalHeader>
              <ModalBody>
                {selectedCaseStudy && (
                  <div className="space-y-4">
                    <Input
                      label="案例集标题"
                      placeholder="输入案例集标题"
                      value={selectedCaseStudy.title}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, title: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="作者"
                      placeholder="输入作者姓名"
                      value={selectedCaseStudy.author}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, author: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="学科分类"
                      placeholder="例如：社会学、经济学"
                      value={selectedCaseStudy.discipline}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, discipline: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="简述"
                      placeholder="简要描述（最多30字符）"
                      value={selectedCaseStudy.summary || ''}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, summary: e.target.value})}
                      maxLength={30}
                    />
                    <Input
                      label="发表刊物"
                      placeholder="例如：中国社会科学"
                      value={selectedCaseStudy.publication || ''}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, publication: e.target.value})}
                    />
                    <Input
                      label="发表年份"
                      type="number"
                      placeholder="例如：2024"
                      value={selectedCaseStudy.publicationYear?.toString() || ''}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, publicationYear: parseInt(e.target.value) || undefined})}
                    />
                    <Input
                      label="论文链接"
                      placeholder="https://example.com/paper"
                      value={selectedCaseStudy.publicationUrl || ''}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, publicationUrl: e.target.value})}
                      type="url"
                    />
                    <Input
                      label="线上实操环境链接"
                      placeholder="https://practice.example.com"
                      value={selectedCaseStudy.practiceUrl || ''}
                      onChange={(e) => setSelectedCaseStudy({...selectedCaseStudy, practiceUrl: e.target.value})}
                      type="url"
                      description="管理员可以在此设置实操环境的访问链接"
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button color="primary" onPress={handleUpdateCaseStudy}>
                  保存更改
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onOpenChange={onReviewOpenChange}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>审核案例集</ModalHeader>
              <ModalBody>
                {selectedCaseStudy && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedCaseStudy.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">作者: {selectedCaseStudy.author}</p>
                        <Chip size="sm" color="primary" variant="flat" className="mt-2">
                          {selectedCaseStudy.discipline}
                        </Chip>
                      </div>
                      <Button
                        as={Link}
                        href={`/casestudies/${selectedCaseStudy.id}`}
                        target="_blank"
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<ExternalLinkIcon className="w-4 h-4" />}
                      >
                        查看完整详情
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">上传者</p>
                        <p className="text-gray-600">{selectedCaseStudy.uploadedBy || '未知'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">上传时间</p>
                        <p className="text-gray-600">{new Date(selectedCaseStudy.uploadTime).toLocaleString('zh-CN')}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">发表刊物</p>
                        <p className="text-gray-600">{selectedCaseStudy.publication || '未填写'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">文件数量</p>
                        <p className="text-gray-600">{selectedCaseStudy._count.files} 个</p>
                      </div>
                    </div>
                    <Alert>
                      <AlertDescription>
                        💡 点击上方"查看完整详情"按钮可在新标签页中查看案例集的完整信息。<br/><br/>
                        <strong>批准</strong>后案例集将自动上线并对用户可见。<br/>
                        <strong>拒绝</strong>将标记为已审核但隐藏，管理员可稍后手动上线。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<XCircleIcon className="w-4 h-4" />}
                  onPress={() => handleReview('reject')}
                >
                  拒绝
                </Button>
                <Button
                  color="success"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  onPress={() => handleReview('approve')}
                >
                  批准上线
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
};

export default CaseStudyManagementPage;
