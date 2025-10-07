'use client'

import { useState, useEffect, useCallback, useMemo, Key, FC } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeftIcon,
  SearchIcon,
  EyeIcon,
  TrashIcon,
  EditIcon,
  StarIcon,
  PieChartIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  FileTextIcon
} from 'lucide-react'
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Spinner, Chip, Tooltip, Selection, SortDescriptor,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Input, Textarea, Button, Select, SelectItem
} from "@nextui-org/react"

interface Dataset {
  id: string
  name: string
  catalog: string
  summary?: string
  description: string
  source?: string
  sourceUrl?: string
  sourceDate?: string
  recommendedCitations?: string[]
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  isFeatured?: boolean
  enableDataAnalysis: boolean
  enablePreview: boolean
  downloadCount: number
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

const CATEGORIES = [
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

const DatasetManagementPage: FC = () => {
  const router = useRouter()
  const [datasets, setDatasets] = useState<Dataset[]>([])
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
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [editingCitations, setEditingCitations] = useState<string[]>(['']);

  const handleEditClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setEditingCitations(dataset.recommendedCitations && dataset.recommendedCitations.length > 0 ? dataset.recommendedCitations : ['']);
    onEditOpen();
  };

  const handleReviewClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    onReviewOpen();
  };

  const addCitation = () => {
    setEditingCitations([...editingCitations, '']);
  };

  const removeCitation = (index: number) => {
    if (editingCitations.length > 1) {
      setEditingCitations(editingCitations.filter((_, i) => i !== index));
    }
  };

  const updateCitation = (index: number, value: string) => {
    const newCitations = [...editingCitations];
    newCitations[index] = value;
    setEditingCitations(newCitations);
  };

  const handleUpdateDataset = async () => {
    if (!selectedDataset) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const validCitations = editingCitations.filter(c => c.trim() !== '');
      const { id, ...dataToUpdate } = {
        ...selectedDataset,
        recommendedCitations: validCitations
      };

      const response = await fetch(`/api/admin/datasets/${id}`, {
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
      console.error('Failed to update dataset:', error);
      alert(`更新失败: ${error.message}`);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedDataset) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/datasets/${selectedDataset.id}/review`, {
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
      const res = await fetch('/api/admin/datasets?limit=10000', {
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
      setDatasets(data.datasets || [])
    } catch (error) {
      console.error("获取数据集失败:", error)
      setDatasets([])
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
    if (!confirm('确定要删除这个数据集吗？此操作不可逆！')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/datasets/${id}`, {
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

  const handleToggleVisibility = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !dataset.isVisible }),
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

  const handleToggleFeatured = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: !dataset.isFeatured }),
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

  const handleTogglePreview = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    console.log('Toggling preview for dataset:', dataset.id, 'Current state:', dataset.enablePreview, 'New state:', !dataset.enablePreview)

    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enablePreview: !dataset.enablePreview }),
      })

      console.log('Toggle preview response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Toggle preview success:', result)
        await fetchData()
      } else {
        const err = await response.json()
        console.error('Toggle preview failed:', err)
        alert(`切换预览状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      console.error('Toggle preview network error:', err)
      alert('切换预览状态时发生网络错误')
    }
  }, [router, fetchData])

  const handleToggleDataAnalysis = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')

    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enableDataAnalysis: !dataset.enableDataAnalysis }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        const err = await response.json()
        alert(`切换数据分析状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换数据分析状态时发生网络错误')
    }
  }, [router, fetchData])

  const filteredDatasets = useMemo(() => {
    let filtered = [...datasets];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.catalog.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    const statusFilterValue = Array.from(statusFilter)[0];
    if (statusFilterValue && statusFilterValue !== "all") {
      filtered = filtered.filter(d => {
        const status = d.isReviewed ? (d.isVisible ? 'approved' : 'hidden') : 'pending';
        return status === statusFilterValue;
      });
    }

    // 排序
    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const first = a[sortDescriptor.column as keyof Dataset];
        const second = b[sortDescriptor.column as keyof Dataset];
        const cmp = first < second ? -1 : first > second ? 1 : 0;
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }

    return filtered;
  }, [datasets, searchTerm, statusFilter, sortDescriptor]);

  const pendingCount = datasets.filter(d => !d.isReviewed).length;

  const renderCell = useCallback((dataset: Dataset, columnKey: Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/datasets/${dataset.id}`}
              target="_blank"
              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              {dataset.name}
              <ExternalLinkIcon className="w-3 h-3" />
            </Link>
            {dataset.summary && (
              <p className="text-xs text-gray-500 line-clamp-1">{dataset.summary}</p>
            )}
          </div>
        );
      case "catalog":
        return <Chip size="sm" variant="flat" color="primary">{dataset.catalog}</Chip>;
      case "status":
        const currentStatus = dataset.isReviewed ? (dataset.isVisible ? 'approved' : 'hidden') : 'pending';
        return (
          <Chip color={STATUS_COLOR_MAP[currentStatus]} size="sm" variant="flat">
            {STATUS_OPTIONS.find(s => s.uid === currentStatus)?.name}
          </Chip>
        );
      case "uploadTime":
        return (
          <div className="flex flex-col text-sm">
            <span>{new Date(dataset.uploadTime).toLocaleDateString('zh-CN')}</span>
            <span className="text-xs text-gray-500">{dataset.uploadedBy}</span>
          </div>
        );
      case "stats":
        return (
          <div className="flex flex-col text-xs text-gray-600">
            <span>下载: {dataset.downloadCount}</span>
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {!dataset.isReviewed && (
              <Tooltip content="审核此数据集">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="warning"
                  onClick={() => handleReviewClick(dataset)}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            <Tooltip content="编辑数据集详细信息">
              <Button isIconOnly size="sm" variant="light" onClick={() => handleEditClick(dataset)}>
                <EditIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.isVisible ? "隐藏数据集（用户不可见）" : "显示数据集（用户可见）"}>
              <Button
                isIconOnly
                size="sm"
                variant={dataset.isVisible ? "flat" : "light"}
                color={dataset.isVisible ? "success" : "default"}
                onClick={() => handleToggleVisibility(dataset)}
              >
                <EyeIcon className={`w-4 h-4 ${dataset.isVisible ? 'text-green-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.isFeatured ? "取消精选标记" : "标记为精选数据集"}>
              <Button
                isIconOnly
                size="sm"
                variant={dataset.isFeatured ? "flat" : "light"}
                color={dataset.isFeatured ? "warning" : "default"}
                onClick={() => handleToggleFeatured(dataset)}
              >
                <StarIcon className={`w-4 h-4 ${dataset.isFeatured ? 'text-yellow-500' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.enablePreview ? "禁用数据预览" : "启用数据预览"}>
              <Button
                isIconOnly
                size="sm"
                variant={dataset.enablePreview ? "flat" : "light"}
                color={dataset.enablePreview ? "primary" : "default"}
                onClick={() => handleTogglePreview(dataset)}
              >
                <EyeIcon className={`w-4 h-4 ${dataset.enablePreview ? 'text-blue-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.enableDataAnalysis ? "禁用数据分析" : "启用数据分析"}>
              <Button
                isIconOnly
                size="sm"
                variant={dataset.enableDataAnalysis ? "flat" : "light"}
                color={dataset.enableDataAnalysis ? "secondary" : "default"}
                onClick={() => handleToggleDataAnalysis(dataset)}
              >
                <PieChartIcon className={`w-4 h-4 ${dataset.enableDataAnalysis ? 'text-purple-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="永久删除数据集">
              <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(dataset.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return dataset[columnKey as keyof Dataset];
    }
  }, [handleEditClick, handleReviewClick, handleToggleVisibility, handleToggleFeatured, handleTogglePreview, handleToggleDataAnalysis, handleDelete]);

  const columns = [
    {name: "数据集名称", uid: "name"},
    {name: "分类", uid: "catalog"},
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
              <h1 className="text-2xl font-bold text-gray-900">数据集管理</h1>
              <p className="text-sm text-gray-500 mt-1">管理所有数据集，包括审核、编辑和发布</p>
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
              <div className="text-sm text-gray-500">总数据集</div>
              <div className="text-2xl font-bold text-gray-900">{datasets.length}</div>
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
                {datasets.filter(d => d.isReviewed && d.isVisible).length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">总下载量</div>
              <div className="text-2xl font-bold text-blue-600">
                {datasets.reduce((sum, d) => sum + d.downloadCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            isClearable
            className="flex-1"
            placeholder="搜索数据集名称或分类..."
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
              aria-label="数据集管理列表"
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.uid === "uploadTime" || column.uid === "name"}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"没有找到数据集"}
                items={filteredDatasets}
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
                <h3 className="text-xl font-bold">编辑数据集</h3>
                <p className="text-sm font-normal text-gray-500">修改数据集的详细信息</p>
              </ModalHeader>
              <ModalBody>
                {selectedDataset && (
                  <div className="space-y-4">
                    <Input
                      label="数据集名称"
                      placeholder="输入数据集名称"
                      value={selectedDataset.name}
                      onChange={(e) => setSelectedDataset({...selectedDataset, name: e.target.value})}
                      isRequired
                    />
                    <Select
                      label="数据集分类"
                      placeholder="选择分类"
                      selectedKeys={[selectedDataset.catalog]}
                      onChange={(e) => setSelectedDataset({...selectedDataset, catalog: e.target.value})}
                      isRequired
                    >
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="简述"
                      placeholder="简要描述（最多30字）"
                      value={selectedDataset.summary || ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, summary: e.target.value})}
                      maxLength={30}
                    />
                    <Textarea
                      label="详细描述"
                      placeholder="详细描述数据集的内容、结构、变量等（支持Markdown）"
                      value={selectedDataset.description}
                      onChange={(e) => setSelectedDataset({...selectedDataset, description: e.target.value})}
                      minRows={4}
                      isRequired
                    />
                    <Input
                      label="数据来源"
                      placeholder="例如：世界银行、国家统计局"
                      value={selectedDataset.source || ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, source: e.target.value})}
                    />
                    <Input
                      label="来源URL"
                      placeholder="https://example.com/data"
                      value={selectedDataset.sourceUrl || ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, sourceUrl: e.target.value})}
                      type="url"
                    />
                    <Input
                      label="数据获取日期"
                      type="date"
                      value={selectedDataset.sourceDate ? new Date(selectedDataset.sourceDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, sourceDate: e.target.value})}
                    />

                    {/* Citations */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">推荐引用文献</label>
                        <Button size="sm" color="primary" variant="flat" onClick={addCitation}>
                          + 添加引用
                        </Button>
                      </div>
                      {editingCitations.map((citation, index) => (
                        <div key={index} className="flex gap-2">
                          <Textarea
                            value={citation}
                            onChange={(e) => updateCitation(index, e.target.value)}
                            placeholder="例如：张三, 李四. 数据集名称[J]. 期刊名, 年份, 卷(期): 页码."
                            minRows={2}
                          />
                          {editingCitations.length > 1 && (
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              onClick={() => removeCitation(index)}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button color="primary" onPress={handleUpdateDataset}>
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
              <ModalHeader>审核数据集</ModalHeader>
              <ModalBody>
                {selectedDataset && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedDataset.name}</h3>
                        <Chip size="sm" color="primary" variant="flat" className="mt-2">
                          {selectedDataset.catalog}
                        </Chip>
                      </div>
                      <Button
                        as={Link}
                        href={`/datasets/${selectedDataset.id}`}
                        target="_blank"
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<ExternalLinkIcon className="w-4 h-4" />}
                      >
                        查看完整详情
                      </Button>
                    </div>
                    {selectedDataset.summary && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">简述</p>
                        <p className="text-sm text-gray-600">{selectedDataset.summary}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">详细描述</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{selectedDataset.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">上传者</p>
                        <p className="text-gray-600">{selectedDataset.uploadedBy}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">上传时间</p>
                        <p className="text-gray-600">{new Date(selectedDataset.uploadTime).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>
                    <Alert>
                      <AlertDescription>
                        💡 点击上方"查看完整详情"按钮可在新标签页中查看数据集的完整信息，包括文件列表、详细描述等。<br/><br/>
                        <strong>批准</strong>后数据集将自动上线并对用户可见。<br/>
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

export default DatasetManagementPage;
