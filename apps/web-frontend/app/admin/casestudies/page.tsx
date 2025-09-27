'use client'

import { useState, useEffect, useCallback, useMemo, Key } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CardHeader } from '@/components/ui/card'
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Pagination, Spinner, Chip, Tooltip, Selection, SortDescriptor,
  Button, Input
} from "@nextui-org/react"
import { ArrowLeftIcon, SearchIcon, EyeIcon, TrashIcon, ChevronDownIcon } from 'lucide-react'

interface CaseStudy {
  id: string
  title: string
  author: string
  publication?: string
  uploadTime: string
  isReviewed: boolean
  isVisible: boolean
  downloadCount: number
  _count: { files: number }
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

const INITIAL_VISIBLE_COLUMNS = ["title", "author", "status", "uploadTime", "actions"];

const COLUMNS = [
  {name: "标题", uid: "title", sortable: true},
  {name: "作者", uid: "author"},
  {name: "状态", uid: "status"},
  {name: "文件数", uid: "files"},
  {name: "上传时间", uid: "uploadTime", sortable: true},
  {name: "操作", uid: "actions"},
];

const CaseStudyManagementPage = () => {
  const router = useRouter()
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Selection>("all")
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
    // TODO: Implement pagination and filtering from backend
    fetch('/api/admin/casestudies?limit=1000', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      setCaseStudies(data.caseStudies || [])
      setTotalPages(data.pagination?.totalPages || 1)
    })
    .catch(() => setCaseStudies([]))
    .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = useCallback(async (id: string) => {
    const token = localStorage.getItem('admin_token')
    if (!token || !confirm('确定要删除这个案例集吗？')) return
    
    try {
      const response = await fetch(`/api/admin/casestudies/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) fetchData()
      else alert('删除失败')
    } catch (err) {
      alert('删除时发生网络错误')
    }
  }, [router, fetchData])

  const handleToggleVisibility = useCallback(async (cs: CaseStudy) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return
    
    try {
      const response = await fetch(`/api/admin/casestudies/${cs.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !cs.isVisible, isReviewed: true }),
      })
      if (response.ok) {
        setCaseStudies(prev => prev.map(c => c.id === cs.id ? {...c, isVisible: !c.isVisible, isReviewed: true} : c))
      } else {
        alert('切换可见性失败')
      }
    } catch (err) {
      alert('切换可见性时发生网络错误')
    }
  }, [router])

  const renderCell = useCallback((cs: CaseStudy, columnKey: Key) => {
    const cellValue = cs[columnKey as keyof CaseStudy];

    switch (columnKey) {
      case "title":
        return <p className="font-bold">{String(cellValue)}</p>;
      case "files":
        return cs._count.files;
      case "status":
        const currentStatus = cs.isReviewed ? (cs.isVisible ? 'approved' : 'hidden') : 'pending';
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
            <Tooltip content={cs.isVisible ? "隐藏" : "显示"}>
              <Button isIconOnly size="sm" variant="light" onClick={() => handleToggleVisibility(cs)}>
                <EyeIcon className={`w-4 h-4 ${cs.isVisible ? 'text-green-600' : 'text-gray-400'}`} />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="删除">
              <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(cs.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return String(cellValue);
    }
  }, [handleToggleVisibility, handleDelete]);

  const topContent = useMemo(() => {
    return (
      <div className="flex justify-between items-center">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="按标题、作者搜索..."
          startContent={<SearchIcon />}
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <Dropdown>
          <DropdownTrigger><Button endContent={<ChevronDownIcon />} variant="flat">状态</Button></DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Status Filter"
            closeOnSelect={false}
            selectedKeys={statusFilter}
            selectionMode="single"
            onSelectionChange={setStatusFilter}
          >
            {STATUS_OPTIONS.map((status) => (
              <DropdownItem key={status.uid}>{status.name}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }, [searchTerm, statusFilter]);

  return (
    <div className="p-4 sm:p-8">
      <CardHeader className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" isIconOnly><ArrowLeftIcon className="h-5 w-5" /></Button>
        </Link>
        <h2 className="text-xl font-bold">案例集管理</h2>
      </CardHeader>
      <Table 
        aria-label="案例集管理列表"
        topContent={topContent}
        topContentPlacement="outside"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination isCompact showControls showShadow color="primary" page={page} total={totalPages} onChange={setPage} />
          </div>
        }
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={COLUMNS}>
          {(column) => <TableColumn key={column.uid} allowsSorting={column.sortable}>{column.name}</TableColumn>}
        </TableHeader>
        <TableBody emptyContent={"没有找到案例集"} items={caseStudies} isLoading={loading}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
};

export default CaseStudyManagementPage;