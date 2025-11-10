'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardBody, Chip, Button, Select, SelectItem } from '@nextui-org/react'
import { ArrowLeftIcon, FilterIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, DatabaseIcon, BookOpenIcon } from 'lucide-react'

// 动态导入ForceGraph2D以避免SSR问题
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface Node {
  id: string
  type: 'dataset' | 'casestudy'
  label: string
  data: any
}

interface Edge {
  id: string
  source: string
  target: string
}

interface GraphData {
  nodes: Node[]
  edges: Edge[]
  stats: {
    totalDatasets: number
    totalCaseStudies: number
    totalRelationships: number
  }
}

export default function ExplorePage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const forceRef = useRef<any>()

  useEffect(() => {
    fetchGraphData()
  }, [])

  const fetchGraphData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/relationships/graph')
      const data = await response.json()

      if (response.ok) {
        setGraphData(data)
      } else {
        setError(data.error || '获取数据失败')
      }
    } catch (error) {
      console.error('获取关系图数据失败:', error)
      setError('网络错误,请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const getNodeColor = (node: any) => {
    if (node.type === 'dataset') {
      return '#ef4444' // 红色 - 数据集
    } else {
      return '#10b981' // 绿色 - 案例集
    }
  }

  const getNodeSize = (node: any) => {
    // 根据下载次数调整节点大小
    const downloadCount = node.data?.downloadCount || 0
    return Math.max(5, Math.min(15, 5 + downloadCount / 10))
  }

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
  }, [])

  const handleZoomIn = () => {
    if (forceRef.current) {
      forceRef.current.zoom(forceRef.current.zoom() * 1.2, 400)
    }
  }

  const handleZoomOut = () => {
    if (forceRef.current) {
      forceRef.current.zoom(forceRef.current.zoom() / 1.2, 400)
    }
  }

  const handleZoomFit = () => {
    if (forceRef.current) {
      forceRef.current.zoomToFit(400, 50)
    }
  }

  // 过滤节点和边
  const filteredData = graphData ? {
    nodes: graphData.nodes.filter(node => {
      if (filterType === 'all') return true
      return node.type === filterType
    }),
    edges: graphData.edges.filter(edge => {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source)
      const targetNode = graphData.nodes.find(n => n.id === edge.target)
      if (filterType === 'all') return true
      return sourceNode?.type === filterType || targetNode?.type === filterType
    })
  } : { nodes: [], edges: [] }

  if (loading) {
    return (
      <div className="min-h-screen bg-white -mx-6 -mt-16">
        <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white -mx-6 -mt-16">
        <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <Button as={Link} href="/" className="bg-red-600 text-white">
                  返回首页
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white -mx-6 -mt-16">
      {/* Hero Section */}
      <section className="border-b border-gray-100 py-12 px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-light text-gray-900 mb-6"
              style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
            >
              知识图谱探索
            </h1>
            <div className="h-1 w-20 bg-red-600 mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl">
              探索案例集与数据集之间的关联关系,发现知识网络中的联系
            </p>
          </div>

          {/* Stats Cards */}
          {graphData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border-2 border-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {graphData.stats.totalDatasets}
                </div>
                <div className="text-sm text-gray-600">数据集</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {graphData.stats.totalCaseStudies}
                </div>
                <div className="text-sm text-gray-600">案例集</div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {graphData.stats.totalRelationships}
                </div>
                <div className="text-sm text-gray-600">关联关系</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Control Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardBody className="p-6 space-y-6">
                  <div>
                    <h3
                      className="text-lg font-medium text-gray-900 mb-4"
                      style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                    >
                      控制面板
                    </h3>

                    {/* Filter */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">筛选类型</label>
                      <Select
                        size="sm"
                        selectedKeys={[filterType]}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <SelectItem key="all" value="all">全部</SelectItem>
                        <SelectItem key="dataset" value="dataset">数据集</SelectItem>
                        <SelectItem key="casestudy" value="casestudy">案例集</SelectItem>
                      </Select>
                    </div>

                    {/* Zoom Controls */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">视图控制</label>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="bordered"
                          className="w-full"
                          startContent={<ZoomInIcon className="w-4 h-4" />}
                          onClick={handleZoomIn}
                        >
                          放大
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          className="w-full"
                          startContent={<ZoomOutIcon className="w-4 h-4" />}
                          onClick={handleZoomOut}
                        >
                          缩小
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          className="w-full"
                          startContent={<MaximizeIcon className="w-4 h-4" />}
                          onClick={handleZoomFit}
                        >
                          适应窗口
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">图例</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-600">数据集</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">案例集</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-gray-400"></div>
                        <span className="text-sm text-gray-600">关联关系</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Node Info */}
                  {selectedNode && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">节点详情</h4>
                      <div className="space-y-2">
                        <Chip
                          size="sm"
                          className={selectedNode.type === 'dataset' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                        >
                          {selectedNode.type === 'dataset' ? '数据集' : '案例集'}
                        </Chip>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {selectedNode.label}
                        </p>
                        {selectedNode.data?.summary && (
                          <p className="text-xs text-gray-600">
                            {selectedNode.data.summary}
                          </p>
                        )}
                        <Button
                          as={Link}
                          href={selectedNode.type === 'dataset' ? `/datasets/${selectedNode.id}` : `/casestudies/${selectedNode.id}`}
                          size="sm"
                          className="w-full mt-2 bg-red-600 text-white"
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Graph Visualization */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <CardBody className="p-0">
                  <div className="relative w-full" style={{ height: '700px' }}>
                    {typeof window !== 'undefined' && (
                      <ForceGraph2D
                        ref={forceRef}
                        graphData={{
                          nodes: filteredData.nodes.map(n => ({ ...n, name: n.label })),
                          links: filteredData.edges.map(e => ({ source: e.source, target: e.target }))
                        }}
                        nodeLabel={(node: any) => node.label}
                        nodeColor={getNodeColor}
                        nodeVal={getNodeSize}
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                          const label = node.label
                          const fontSize = 12 / globalScale
                          ctx.font = `${fontSize}px Sans-Serif`
                          const textWidth = ctx.measureText(label).width
                          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2)

                          // Draw node circle
                          ctx.beginPath()
                          ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI, false)
                          ctx.fillStyle = getNodeColor(node)
                          ctx.fill()

                          // Draw label background
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + getNodeSize(node) + 2, bckgDimensions[0], bckgDimensions[1])

                          // Draw label text
                          ctx.textAlign = 'center'
                          ctx.textBaseline = 'top'
                          ctx.fillStyle = '#374151'
                          ctx.fillText(label, node.x, node.y + getNodeSize(node) + 2)
                        }}
                        onNodeClick={handleNodeClick}
                        linkColor={() => '#9ca3af'}
                        linkWidth={2}
                        backgroundColor="#ffffff"
                        cooldownTicks={100}
                        onEngineStop={() => {
                          if (forceRef.current) {
                            forceRef.current.zoomToFit(400, 50)
                          }
                        }}
                      />
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
