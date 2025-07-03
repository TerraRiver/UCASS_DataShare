'use client'

import { useState, useEffect, useCallback, useMemo, Key, FC } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeftIcon,
  SearchIcon,
  FolderIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  SettingsIcon,
  ChevronDownIcon,
  EditIcon,
  ToggleLeftIcon
} from 'lucide-react'
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Pagination, Spinner, Chip, Tooltip, Selection, SortDescriptor
} from "@nextui-org/react"

interface Dataset {
  id: string
  name: string
  catalog: string
  description: string
  fileType: string
  fileSize: number
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  enableVisualization: boolean
  enableAnalysis: boolean
  downloadCount: number
}

type StatusColor = "success" | "warning" | "default"

const STATUS_OPTIONS = [
  {name: "已上线", uid: "approved"},
  {name: "待审核", uid: "pending"},
  {name: "已隐藏", uid: "hidden"},
];

const STATUS_COLOR_MAP: Record<string, StatusColor> = {
  approved: "success",
  pending: "warning",
  hidden: "default",
};

const INITIAL_VISIBLE_COLUMNS = ["name", "catalog", "status", "uploadTime", "actions"];

const COLUMNS = [
  {name: "名称", uid: "name", sortable: true},
  {name: "分类", uid: "catalog"},
  {name: "状态", uid: "status"},
  {name: "上传时间", uid: "uploadTime", sortable: true},
  {name: "操作", uid: "actions"},
];

const ROWS_PER_PAGE = 10;

const DatasetManagementPage: FC = () => {
  const router = useRouter()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Selection>("all")
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "uploadTime",
    direction: "descending",
  });

  const fetchData = useCallback(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    
    setLoading(true)
    fetch('/api/admin/datasets?limit=10000', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_token')
          router.push('/admin/login')
        }
        throw new Error('获取数据失败')
      }
      return res.json()
    })
    .then(data => {
      setDatasets(data.datasets || [])
    })
    .catch(error => {
      console.error("获取数据集失败:", error)
      setDatasets([])
    })
    .finally(() => {
      setLoading(false)
    })
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
        fetchData()
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
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}/visibility`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visible: !dataset.isVisible }),
      })
      if (response.ok) {
        setDatasets(prev => prev.map(d => d.id === dataset.id ? {...d, isVisible: !d.isVisible, isReviewed: true} : d))
      } else {
        const err = await response.json()
        alert(`切换可见性失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换可见性时发生网络错误')
    } finally {
      setLoading(false)
    }
  }, [router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusBadge = (dataset: Dataset) => {
    if (!dataset.isReviewed) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">待审核</span>
    }
    if (dataset.isVisible) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">已发布</span>
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">已隐藏</span>
  }

  const onSearchChange = useCallback((value) => {
    if (value) {
      setSearchTerm(value)
      setPage(1)
    } else {
      setSearchTerm("")
    }
  }, [])
  
  const onClear = useCallback(() => {
    setSearchTerm("")
    setPage(1)
  }, [])

  const headerColumns = useMemo(() => {
    const allColumns = [
      {name: "ID", uid: "id"},
      {name: "名称", uid: "name"},
      {name: "分类", uid: "catalog"},
      {name: "状态", uid: "status"},
      {name: "上传时间", uid: "uploadTime"},
      {name: "操作", uid: "actions"},
    ];
    return allColumns.filter((column) => visibleColumns.has(column.uid));
  }, [visibleColumns]);

  const renderCell = useCallback((dataset, columnKey) => {
    const cellValue = dataset[columnKey];

    switch (columnKey) {
      case "name":
        return <p className="font-bold">{cellValue}</p>;
      case "status":
        const currentStatus = dataset.isReviewed ? (dataset.isVisible ? 'approved' : 'hidden') : 'pending';
        return (
          <Chip color={STATUS_COLOR_MAP[currentStatus]} size="sm" variant="flat">
            {STATUS_OPTIONS.find(s => s.uid === currentStatus)?.name}
          </Chip>
        );
      case "uploadTime":
        return new Date(cellValue).toLocaleDateString();
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="编辑数据集">
              <Button isIconOnly size="sm" variant="light"><EditIcon className="w-4 h-4" /></Button>
            </Tooltip>
            <Tooltip content="切换可见性">
              <Button isIconOnly size="sm" variant="light" onClick={() => handleToggleVisibility(dataset)}><ToggleLeftIcon className="w-4 h-4" /></Button>
            </Tooltip>
            <Tooltip color="danger" content="删除数据集">
              <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(dataset.id)}><TrashIcon className="w-4 h-4" /></Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, [handleDelete, handleToggleVisibility]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="按名称或分类搜索..."
            startContent={<SearchIcon />}
            value={searchTerm}
            onClear={onClear}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger>
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  状态
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="single"
                onSelectionChange={setStatusFilter}
              >
                <DropdownItem key="all" className="capitalize">全部</DropdownItem>
                {STATUS_OPTIONS.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [searchTerm, onSearchChange, onClear, statusFilter]);

  const filteredItems = useMemo(() => {
    let filteredDatasets = [...datasets];
    if (searchTerm) {
      filteredDatasets = filteredDatasets.filter(dataset =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.catalog.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const statusKey = statusFilter !== 'all' && Array.from(statusFilter)[0];
    if (statusKey) {
        filteredDatasets = filteredDatasets.filter(dataset => {
            const currentStatus = dataset.isReviewed ? (dataset.isVisible ? 'approved' : 'hidden') : 'pending';
            return currentStatus === statusKey;
        });
    }
    return filteredDatasets;
  }, [datasets, searchTerm, statusFilter]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const sortedItems = useMemo(() => {
    return [...pagedItems].sort((a: Dataset, b: Dataset) => {
      const first = a[sortDescriptor.column as keyof Dataset] as any;
      const second = b[sortDescriptor.column as keyof Dataset] as any;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, pagedItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回仪表板
            </Link>
            <h1 className="text-2xl font-bold">数据集管理</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {topContent}
          </CardContent>
        </Card>

        {/* Dataset List */}
        <Card>
          <CardHeader>
            <CardTitle>数据集列表 ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              aria-label="数据集管理表格"
              isHeaderSticky
              bottomContent={
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={Math.ceil(filteredItems.length / ROWS_PER_PAGE)}
                    onChange={(p) => setPage(p)}
                  />
                </div>
              }
              topContent={topContent}
              topContentPlacement="outside"
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={COLUMNS}>
                {(column) => (
                  <TableColumn key={column.uid} allowsSorting={column.sortable}>
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody 
                items={sortedItems} 
                isLoading={loading}
                loadingContent={<Spinner label="加载中..." />}
                emptyContent={"未找到匹配的数据集"}
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
    </div>
  )
}

export default DatasetManagementPage 