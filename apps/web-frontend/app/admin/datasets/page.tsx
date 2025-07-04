'use client'

import { useState, useEffect, useCallback, useMemo, Key, FC } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ToggleLeftIcon,
  StarIcon,
  BarChartIcon,
  PieChartIcon
} from 'lucide-react'
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Pagination, Spinner, Chip, Tooltip, Selection, SortDescriptor,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, 
  Input, Textarea, Button
} from "@nextui-org/react"

interface Dataset {
  id: string
  name: string
  catalog: string
  description: string
  source?: string
  sourceUrl?: string
  sourceDate?: string
  fileType: string
  fileSize: number
  uploadTime: string
  uploadedBy: string
  isReviewed: boolean
  isVisible: boolean
  isFeatured?: boolean
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
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "uploadTime",
    direction: "descending",
  });
  
  // Modal states
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const handleEditClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    onOpen();
  };

  const handleUpdateDataset = async () => {
    if (!selectedDataset) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const { id, ...dataToUpdate } = selectedDataset;
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
      
      setDatasets(prev => prev.map(d => d.id === id ? selectedDataset : d));
      onOpenChange(); 
    } catch (error: any) {
      console.error('Failed to update dataset:', error);
      alert(`更新失败: ${error.message}`);
    }
  };


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
        setDatasets(prev => prev.map(d => d.id === dataset.id ? {...d, isFeatured: !d.isFeatured} : d))
      } else {
        const err = await response.json()
        alert(`切换精选状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换精选状态时发生网络错误')
    }
  }, [router])

  const handleToggleVisualization = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')
    
    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enableVisualization: !dataset.enableVisualization }),
      })
      if (response.ok) {
        setDatasets(prev => prev.map(d => d.id === dataset.id ? {...d, enableVisualization: !d.enableVisualization} : d))
      } else {
        const err = await response.json()
        alert(`切换可视化状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换可视化状态时发生网络错误')
    }
  }, [router])

  const handleToggleAnalysis = useCallback(async (dataset: Dataset) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return router.push('/admin/login')
    
    try {
      const response = await fetch(`/api/admin/datasets/${dataset.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enableAnalysis: !dataset.enableAnalysis }),
      })
      if (response.ok) {
        setDatasets(prev => prev.map(d => d.id === dataset.id ? {...d, enableAnalysis: !d.enableAnalysis} : d))
      } else {
        const err = await response.json()
        alert(`切换数据分析状态失败: ${err.error || '未知错误'}`)
      }
    } catch (err) {
      alert('切换数据分析状态时发生网络错误')
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
  
  const onSearchChange = useCallback((value: string) => {
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

  const hasSearchFilter = Boolean(searchTerm);

  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

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

  const renderCell = useCallback((dataset: Dataset, columnKey: Key) => {
    const cellValue = dataset[columnKey as keyof Dataset];

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
        return new Date(cellValue as string).toLocaleDateString();
      case "actions":
        return (
          <div className="relative flex items-center gap-1">
            <Tooltip content="编辑数据集">
              <Button isIconOnly size="sm" variant="light" onClick={() => handleEditClick(dataset)}>
                <EditIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.isVisible ? "隐藏数据集" : "显示数据集"}>
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
            <Tooltip content={dataset.isFeatured ? "取消精选" : "设为精选"}>
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
            <Tooltip content={dataset.enableVisualization ? "禁用可视化" : "启用可视化"}>
              <Button 
                isIconOnly 
                size="sm" 
                variant={dataset.enableVisualization ? "flat" : "light"} 
                color={dataset.enableVisualization ? "secondary" : "default"}
                onClick={() => handleToggleVisualization(dataset)}
              >
                <BarChartIcon className={`w-4 h-4 ${dataset.enableVisualization ? 'text-purple-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip content={dataset.enableAnalysis ? "禁用数据分析" : "启用数据分析"}>
              <Button 
                isIconOnly 
                size="sm" 
                variant={dataset.enableAnalysis ? "flat" : "light"} 
                color={dataset.enableAnalysis ? "primary" : "default"}
                onClick={() => handleToggleAnalysis(dataset)}
              >
                <PieChartIcon className={`w-4 h-4 ${dataset.enableAnalysis ? 'text-blue-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="删除数据集">
              <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(dataset.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, [handleEditClick, handleToggleVisibility, handleToggleFeatured, handleToggleVisualization, handleToggleAnalysis, handleDelete]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<SearchIcon />}
            value={searchTerm}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Status
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
  }, [
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    datasets.length,
    hasSearchFilter,
  ]);

  return (
    <>
      <div className="p-4 sm:p-8">
          <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" isIconOnly>
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-xl font-bold">数据集管理</h2>
          </CardHeader>
          <CardContent>
             <Table 
              aria-label="数据集管理列表"
              isHeaderSticky
              bottomContentPlacement="outside"
              classNames={{
                wrapper: "max-h-[500px]",
                table: "min-w-[800px]",
              }}
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              onSortChange={setSortDescriptor}
             >
              <TableHeader columns={headerColumns}>
                {(column) => (
                  <TableColumn 
                    key={column.uid} 
                    align={column.uid === "actions" ? "center" : "start"}
                    width={column.uid === "actions" ? 300 : undefined}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody emptyContent={"没有找到数据集"} items={datasets}>
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
      </div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">编辑数据集</ModalHeader>
              <ModalBody>
                {selectedDataset && (
                  <div className="space-y-4">
                    <Input
                      label="数据集名称"
                      value={selectedDataset.name}
                      onChange={(e) => setSelectedDataset({...selectedDataset, name: e.target.value})}
                    />
                     <Textarea
                      label="数据集描述"
                      placeholder="详细描述数据集的内容、结构、变量等"
                      value={selectedDataset.description}
                      onChange={(e) => setSelectedDataset({...selectedDataset, description: e.target.value})}
                    />
                    <Input
                      label="数据来源"
                      placeholder="例如：世界银行、国家统计局"
                      value={selectedDataset.source || ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, source: e.target.value})}
                    />
                    <Input
                      label="来源地址"
                      placeholder="http://example.com/data"
                      value={selectedDataset.sourceUrl || ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, sourceUrl: e.target.value})}
                    />
                    <Input
                      label="获取时间"
                      type="date"
                      placeholder="选择获取数据的日期"
                      value={selectedDataset.sourceDate ? new Date(selectedDataset.sourceDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setSelectedDataset({...selectedDataset, sourceDate: e.target.value})}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onClick={onClose}>
                  取消
                </Button>
                <Button color="primary" onClick={handleUpdateDataset}>
                  保存
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