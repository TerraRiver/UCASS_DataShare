'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, CardBody, Divider, Select, SelectItem, Chip } from '@nextui-org/react'
import { PlusIcon, TrashIcon, LinkIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react'

interface CaseStudy {
  id: string
  title: string
  discipline: string
}

interface Dataset {
  id: string
  name: string
  catalog: string
}

interface Relationship {
  id: string
  caseStudyId: string
  datasetId: string
  caseStudy: {
    id: string
    title: string
  }
  dataset: {
    id: string
    name: string
  }
}

export default function RelationshipsManagementPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<string>('')
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set())
  const [existingRelationships, setExistingRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCaseStudy) {
      fetchExistingRelationships(selectedCaseStudy)
    } else {
      setExistingRelationships([])
    }
  }, [selectedCaseStudy])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [casestudiesRes, datasetsRes] = await Promise.all([
        fetch('/api/admin/casestudies', { headers }),
        fetch('/api/admin/datasets', { headers })
      ])

      if (casestudiesRes.ok && datasetsRes.ok) {
        const casestudiesData = await casestudiesRes.json()
        const datasetsData = await datasetsRes.json()

        setCaseStudies(casestudiesData.caseStudies || [])
        setDatasets(datasetsData.datasets || [])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      showMessage('error', '获取数据失败')
    }
  }

  const fetchExistingRelationships = async (caseStudyId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/relationships/casestudy/${caseStudyId}/datasets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 将现有关系转换为Set，用于UI显示
        const relationshipIds = new Set<string>(data.datasets.map((ds: Dataset) => ds.id))
        setSelectedDatasets(relationshipIds)
      }
    } catch (error) {
      console.error('获取现有关系失败:', error)
    }
  }

  const handleSaveRelationships = async () => {
    if (!selectedCaseStudy) {
      showMessage('error', '请先选择案例集')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const datasetIds = Array.from(selectedDatasets)

      const response = await fetch('/api/relationships/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseStudyId: selectedCaseStudy,
          datasetIds
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', `成功创建 ${data.created} 个关系${data.skipped > 0 ? `，跳过 ${data.skipped} 个已存在的关系` : ''}`)
        fetchExistingRelationships(selectedCaseStudy)
      } else {
        showMessage('error', data.error || '保存失败')
      }
    } catch (error) {
      showMessage('error', '保存失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDataset = (datasetId: string) => {
    const newSelection = new Set(selectedDatasets)
    if (newSelection.has(datasetId)) {
      newSelection.delete(datasetId)
    } else {
      newSelection.add(datasetId)
    }
    setSelectedDatasets(newSelection)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const selectedCaseStudyData = caseStudies.find(cs => cs.id === selectedCaseStudy)

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-6">
        <h1
          className="text-4xl font-light text-gray-900"
          style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
        >
          关系管理
        </h1>
        <p className="text-gray-600 mt-2">管理案例集与数据集的关联关系</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg border-2 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* 选择案例集 */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2
                className="text-xl font-medium text-gray-900"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                选择案例集
              </h2>
              <p className="text-sm text-gray-600 mt-1">选择要管理关系的案例集</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <Select
            label="案例集"
            placeholder="请选择案例集"
            selectedKeys={selectedCaseStudy ? [selectedCaseStudy] : []}
            onChange={(e) => setSelectedCaseStudy(e.target.value)}
            className="max-w-full"
          >
            {caseStudies.map((cs) => (
              <SelectItem key={cs.id} value={cs.id}>
                {cs.title}
              </SelectItem>
            ))}
          </Select>

          {selectedCaseStudyData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <span className="font-medium">已选择：</span> {selectedCaseStudyData.title}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                学科：{selectedCaseStudyData.discipline}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 选择关联数据集 */}
      {selectedCaseStudy && (
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                  >
                    关联数据集
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    已选择 {selectedDatasets.size} 个数据集
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSaveRelationships}
                disabled={loading || selectedDatasets.size === 0}
                className="bg-red-600 text-white"
              >
                {loading ? '保存中...' : '保存关系'}
              </Button>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-6">
            <div className="grid gap-3">
              {datasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无数据集
                </div>
              ) : (
                datasets.map((dataset) => {
                  const isSelected = selectedDatasets.has(dataset.id)
                  return (
                    <div
                      key={dataset.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleToggleDataset(dataset.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {dataset.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" className="bg-gray-100 text-gray-700">
                              {dataset.catalog}
                            </Chip>
                          </div>
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleDataset(dataset.id)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
