'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Tree from 'react-d3-tree';
import { Button, Card, Spinner } from '@nextui-org/react';
import { BookOpenIcon, FolderIcon, FileIcon, ChevronLeftIcon } from 'lucide-react';

interface MethodModule {
  id: string;
  code: string;
  name: string;
  englishName: string;
  summary?: string;
  downloadCount: number;
  previewCount: number;
}

interface MethodCategory {
  id: string;
  code: string;
  name: string;
  englishName: string;
  sortOrder: number;
  modules: MethodModule[];
}

interface TreeNode {
  name: string;
  attributes?: {
    id?: string;
    code?: string;
    englishName?: string;
    type: 'root' | 'category' | 'module';
  };
  children?: TreeNode[];
}

export default function MethodsPage() {
  const [categories, setCategories] = useState<MethodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/methods/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      setError('获取方法模块失败');
    } finally {
      setLoading(false);
    }
  };

  // 将数据转换为树形结构
  const buildTreeData = (): TreeNode => {
    return {
      name: '方法模块',
      attributes: {
        type: 'root',
        englishName: 'Method Modules',
      },
      children: categories.map((category) => ({
        name: `[${category.code}] ${category.name}`,
        attributes: {
          id: category.id,
          code: category.code,
          englishName: category.englishName,
          type: 'category',
        },
        children: category.modules.map((module) => ({
          name: `[${module.code}] ${module.name}`,
          attributes: {
            id: module.id,
            code: module.code,
            englishName: module.englishName,
            type: 'module',
          },
        })),
      })),
    };
  };

  const handleNodeClick = (nodeDatum: any) => {
    if (nodeDatum.attributes?.type === 'module') {
      // 点击模块节点，跳转到详情页
      router.push(`/methods/${nodeDatum.attributes.id}`);
    } else {
      // 点击其他节点，显示信息
      setSelectedNode(nodeDatum);
    }
  };

  const renderNodeLabel = (nodeDatum: any) => {
    const { name, attributes } = nodeDatum;
    let icon = <FileIcon className="w-4 h-4" />;
    let bgColor = 'bg-white';
    let borderColor = 'border-gray-300';
    let textColor = 'text-gray-900';

    if (attributes?.type === 'root') {
      icon = <BookOpenIcon className="w-5 h-5" />;
      bgColor = 'bg-red-50';
      borderColor = 'border-red-600';
      textColor = 'text-red-700';
    } else if (attributes?.type === 'category') {
      icon = <FolderIcon className="w-4 h-4" />;
      bgColor = 'bg-blue-50';
      borderColor = 'border-blue-400';
      textColor = 'text-blue-700';
    } else if (attributes?.type === 'module') {
      icon = <FileIcon className="w-4 h-4" />;
      bgColor = 'bg-green-50';
      borderColor = 'border-green-400';
      textColor = 'text-green-700';
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (attributes?.type === 'module') {
        router.push(`/methods/${attributes.id}`);
      }
    };

    return (
      <g>
        <foreignObject x="-100" y="-20" width="200" height="40">
          <div
            onClick={handleClick}
            className={`${bgColor} ${textColor} border-2 ${borderColor} rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${attributes?.type === 'module' ? 'cursor-pointer' : 'cursor-default'} hover:shadow-md transition-shadow`}
            style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
          >
            {icon}
            <span className="truncate max-w-[150px]">{name}</span>
          </div>
        </foreignObject>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" color="danger" />
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Button onClick={fetchCategories} className="bg-red-600 text-white">
            重试
          </Button>
        </div>
      </div>
    );
  }

  const treeData = buildTreeData();
  const totalModules = categories.reduce((sum, cat) => sum + cat.modules.length, 0);

  return (
    <div
      className="min-h-screen bg-white -mx-6 -mt-16 overflow-x-hidden"
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)'
      }}
    >
      {/* Hero Section - 精简版 */}
      <section className="py-8 px-8 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl md:text-4xl font-light text-gray-900 mb-2"
                style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
              >
                方法模块
              </h1>
              <p className="text-base text-gray-600">
                探索计算社会科学与数据分析的方法论体系 · 点击模块节点查看详情
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{categories.length}</div>
                <div className="text-xs">大类</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalModules}</div>
                <div className="text-xs">方法模块</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 图例说明和缩放控制 */}
      <div className="py-4 px-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-600 rounded"></div>
              <span>根节点</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-400 rounded"></div>
              <span>分类</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-400 rounded"></div>
              <span>模块（可点击）</span>
            </div>
          </div>

          {/* 缩放滑块 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 whitespace-nowrap">缩放比例:</span>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tree Visualization - 完全无边框全屏 */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '700px', width: '100vw' }}>
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          translate={{ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 800, y: 100 }}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          nodeSize={{ x: 250, y: 150 }}
          renderCustomNodeElement={(rd3tProps) =>
            renderNodeLabel(rd3tProps.nodeDatum)
          }
          onNodeClick={handleNodeClick}
          zoom={zoomLevel}
          scaleExtent={{ min: 0.3, max: 1.5 }}
          enableLegacyTransitions
          zoomable={false}
        />

      </section>

      {/* 分类列表视图（折叠在下方） */}
      <section className="py-12 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl font-medium text-gray-900 mb-6"
            style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
          >
            分类浏览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="border-2 border-gray-100 hover:border-red-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <FolderIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
                      >
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">{category.englishName}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      分类代码：<span className="font-mono font-semibold">{category.code}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      包含模块：<span className="font-semibold text-red-600">{category.modules.length}</span> 个
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.modules.slice(0, 3).map((module) => (
                      <div
                        key={module.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/methods/${module.id}`);
                        }}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        {module.code}
                      </div>
                    ))}
                    {category.modules.length > 3 && (
                      <div className="text-xs text-gray-500 px-2 py-1">
                        +{category.modules.length - 3} 更多...
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
