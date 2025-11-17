'use client'

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Select, SelectItem, useDisclosure, Tabs, Tab } from '@nextui-org/react';
import { PlusIcon, EditIcon, TrashIcon, UploadIcon, RefreshCwIcon, FolderIcon, FileIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MethodModule {
  id: string;
  code: string;
  name: string;
  englishName: string;
  summary?: string;
  category: {
    code: string;
    name: string;
  };
  downloadCount: number;
  previewCount: number;
  isVisible: boolean;
  files: any[];
}

interface MethodCategory {
  id: string;
  code: string;
  name: string;
  englishName: string;
  sortOrder: number;
  modules: MethodModule[];
}

export default function AdminMethodsPage() {
  const [categories, setCategories] = useState<MethodCategory[]>([]);
  const [selectedModule, setSelectedModule] = useState<MethodModule | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MethodCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const uploadModal = useDisclosure();
  const categoryModal = useDisclosure();
  const editCategoryModal = useDisclosure();

  // 模块表单状态
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    summary: '',
    categoryCode: '',
    practiceUrl: '',
    enablePractice: false,
    isVisible: true,
  });

  // 分类表单状态
  const [categoryFormData, setCategoryFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    sortOrder: 0,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<{ name: string; files: File[] }[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/methods/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error('获取方法模块失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('获取方法模块失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!formData.code || !formData.name || !formData.englishName || !formData.categoryCode) {
      toast.error('请填写所有必填字段');
      return;
    }

    setUploadingFiles(true);
    const form = new FormData();
    form.append('code', formData.code);
    form.append('name', formData.name);
    form.append('englishName', formData.englishName);
    form.append('summary', formData.summary);
    form.append('categoryCode', formData.categoryCode);
    form.append('practiceUrl', formData.practiceUrl);
    form.append('enablePractice', formData.enablePractice.toString());
    form.append('isVisible', formData.isVisible.toString());

    // 构建文件路径数组
    const filePaths: string[] = [];

    // 上传单个文件（没有相对路径）
    if (files.length > 0) {
      files.forEach((file) => {
        form.append('files', file);
        filePaths.push(file.name); // 单个文件直接使用文件名
      });
    }

    // 上传文件夹中的所有文件（保留相对路径）
    if (folders.length > 0) {
      folders.forEach((folder) => {
        folder.files.forEach((file) => {
          form.append('files', file);
          // @ts-ignore - webkitRelativePath exists
          const relativePath = file.webkitRelativePath || file.name;
          filePaths.push(relativePath);
        });
      });
    }

    // 将文件路径数组作为JSON字符串发送
    form.append('filePaths', JSON.stringify(filePaths));

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/methods/modules/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (response.ok) {
        toast.success('方法模块上传成功');
        uploadModal.onClose();
        fetchCategories();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || '上传失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('上传失败');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm('确定删除此方法模块吗？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/methods/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchCategories();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('删除失败');
    }
  };

  const handleToggleVisibility = async (moduleId: string, isVisible: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/methods/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible: !isVisible }),
      });

      if (response.ok) {
        toast.success('状态更新成功');
        fetchCategories();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('更新失败');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      englishName: '',
      summary: '',
      categoryCode: '',
      practiceUrl: '',
      enablePractice: false,
      isVisible: true,
    });
    setFiles([]);
    setFolders([]);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      code: '',
      name: '',
      englishName: '',
      sortOrder: 0,
    });
  };

  // 创建分类
  const handleCreateCategory = async () => {
    if (!categoryFormData.code || !categoryFormData.name || !categoryFormData.englishName) {
      toast.error('请填写所有必填字段');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/methods/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        toast.success('分类创建成功');
        categoryModal.onClose();
        fetchCategories();
        resetCategoryForm();
      } else {
        const error = await response.json();
        toast.error(error.error || '创建失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('创建失败');
    }
  };

  // 编辑分类
  const handleEditCategory = (category: MethodCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      code: category.code,
      name: category.name,
      englishName: category.englishName,
      sortOrder: category.sortOrder,
    });
    editCategoryModal.onOpen();
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/methods/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        toast.success('分类更新成功');
        editCategoryModal.onClose();
        fetchCategories();
        resetCategoryForm();
        setSelectedCategory(null);
      } else {
        const error = await response.json();
        toast.error(error.error || '更新失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('更新失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.modules.length > 0) {
      toast.error('该分类下还有模块，无法删除');
      return;
    }

    if (!confirm('确定删除此分类吗？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/methods/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchCategories();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('删除失败');
    }
  };

  const totalModules = categories.reduce((sum, cat) => sum + cat.modules.length, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">方法模块管理</h1>
        <p className="text-gray-600">管理计算社会科学方法模块与分类</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">分类总数</div>
          <div className="text-3xl font-bold text-red-600">{categories.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">模块总数</div>
          <div className="text-3xl font-bold text-red-600">{totalModules}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">可见模块</div>
          <div className="text-3xl font-bold text-red-600">
            {categories.reduce((sum, cat) => sum + cat.modules.filter(m => m.isVisible).length, 0)}
          </div>
        </Card>
      </div>

      {/* Tabs切换 */}
      <Tabs aria-label="管理选项" className="mb-6">
        {/* 模块管理Tab */}
        <Tab key="modules" title="模块管理">
          {/* 操作按钮 */}
          <div className="flex gap-4 mb-6 mt-4">
            <Button
              color="danger"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={uploadModal.onOpen}
            >
              上传方法模块
            </Button>
            <Button
              variant="bordered"
              startContent={<RefreshCwIcon className="w-4 h-4" />}
              onPress={fetchCategories}
            >
              刷新
            </Button>
          </div>

          {/* 分类和模块列表 */}
          {categories.map((category) => (
            <Card key={category.id} className="mb-6">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  [{category.code}] {category.name}
                </h2>
                <p className="text-sm text-gray-600">{category.englishName}</p>
              </div>
              <Chip color="primary" variant="flat">
                {category.modules.length} 个模块
              </Chip>
            </div>
          </div>

          {category.modules.length > 0 ? (
            <Table aria-label="方法模块表">
              <TableHeader>
                <TableColumn>代码</TableColumn>
                <TableColumn>名称</TableColumn>
                <TableColumn>英文名称</TableColumn>
                <TableColumn>文件数</TableColumn>
                <TableColumn>下载量</TableColumn>
                <TableColumn>状态</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {category.modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{module.code}</span>
                    </TableCell>
                    <TableCell>{module.name}</TableCell>
                    <TableCell>{module.englishName}</TableCell>
                    <TableCell>{module.files.length}</TableCell>
                    <TableCell>{module.downloadCount}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={module.isVisible ? 'success' : 'default'}
                        variant="flat"
                      >
                        {module.isVisible ? '可见' : '隐藏'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color={module.isVisible ? 'warning' : 'success'}
                          onPress={() => handleToggleVisibility(module.id, module.isVisible)}
                        >
                          {module.isVisible ? '隐藏' : '显示'}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          startContent={<TrashIcon className="w-3 h-3" />}
                          onPress={() => handleDelete(module.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-gray-500">
              该分类下暂无模块
            </div>
          )}
        </Card>
      ))}
        </Tab>

        {/* 分类管理Tab */}
        <Tab key="categories" title="分类管理">
          {/* 操作按钮 */}
          <div className="flex gap-4 mb-6 mt-4">
            <Button
              color="danger"
              startContent={<FolderIcon className="w-4 h-4" />}
              onPress={categoryModal.onOpen}
            >
              创建分类
            </Button>
            <Button
              variant="bordered"
              startContent={<RefreshCwIcon className="w-4 h-4" />}
              onPress={fetchCategories}
            >
              刷新
            </Button>
          </div>

          {/* 分类列表 */}
          <Card>
            <Table aria-label="分类列表">
              <TableHeader>
                <TableColumn>代码</TableColumn>
                <TableColumn>中文名称</TableColumn>
                <TableColumn>英文名称</TableColumn>
                <TableColumn>排序</TableColumn>
                <TableColumn>模块数量</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold">{category.code}</span>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.englishName}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <Chip size="sm" color="primary" variant="flat">
                        {category.modules.length}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<EditIcon className="w-3 h-3" />}
                          onPress={() => handleEditCategory(category)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          startContent={<TrashIcon className="w-3 h-3" />}
                          onPress={() => handleDeleteCategory(category.id)}
                          isDisabled={category.modules.length > 0}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Tab>
      </Tabs>

      {/* 创建分类 Modal */}
      <Modal isOpen={categoryModal.isOpen} onClose={categoryModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>创建分类</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="分类代码"
                placeholder="例如: DA"
                value={categoryFormData.code}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                isRequired
                description="2-3个大写字母"
              />

              <Input
                label="中文名称"
                placeholder="例如: 数据获取"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                isRequired
              />

              <Input
                label="英文名称"
                placeholder="例如: Data Acquisition"
                value={categoryFormData.englishName}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, englishName: e.target.value })}
                isRequired
              />

              <Input
                label="排序"
                type="number"
                placeholder="例如: 1"
                value={categoryFormData.sortOrder.toString()}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 0 })}
                description="数字越小越靠前"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={categoryModal.onClose}>
              取消
            </Button>
            <Button color="danger" onPress={handleCreateCategory}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑分类 Modal */}
      <Modal isOpen={editCategoryModal.isOpen} onClose={editCategoryModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>编辑分类</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="分类代码"
                placeholder="例如: DA"
                value={categoryFormData.code}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                isRequired
                description="2-3个大写字母"
              />

              <Input
                label="中文名称"
                placeholder="例如: 数据获取"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                isRequired
              />

              <Input
                label="英文名称"
                placeholder="例如: Data Acquisition"
                value={categoryFormData.englishName}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, englishName: e.target.value })}
                isRequired
              />

              <Input
                label="排序"
                type="number"
                placeholder="例如: 1"
                value={categoryFormData.sortOrder.toString()}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 0 })}
                description="数字越小越靠前"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={editCategoryModal.onClose}>
              取消
            </Button>
            <Button color="danger" onPress={handleUpdateCategory}>
              更新
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 上传模块 Modal */}
      <Modal
        isOpen={uploadModal.isOpen}
        onClose={() => {
          uploadModal.onClose();
          resetForm();
        }}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl">上传方法模块</h3>
            <p className="text-sm text-gray-500 font-normal">填写模块信息并上传相关文件</p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">基本信息</h4>

                {/* 分类选择 - 使用原生 select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryCode}
                    onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        [{cat.code}] {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="模块代码"
                    placeholder="例如: DA01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    isRequired
                    description="2-4个字符"
                  />
                  <Input
                    label="模块名称"
                    placeholder="例如: 静态网页抓取"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                  />
                </div>

                <Input
                  label="英文名称"
                  placeholder="例如: Static Web Scraping"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  isRequired
                />

                <Input
                  label="简述"
                  placeholder="简短摘要（可选）"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  description="详细内容请上传 README.md 文件"
                />
              </div>

              {/* 实操设置 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">实操设置</h4>

                <Input
                  label="实操链接"
                  placeholder="https://..."
                  value={formData.practiceUrl}
                  onChange={(e) => setFormData({ ...formData, practiceUrl: e.target.value })}
                  description="共享算力平台的实操链接（可选）"
                />

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enablePractice}
                      onChange={(e) => setFormData({ ...formData, enablePractice: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">启用实操链接</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">设为可见</span>
                  </label>
                </div>
              </div>

              {/* 文件上传 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">文件上传（可选）</h4>

                <div className="space-y-3">
                  {/* 统一上传区域 */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-700 mb-2">添加文件或文件夹</p>
                    <p className="text-sm text-gray-500 mb-6">可多次添加，支持文件和文件夹混合上传</p>

                    {/* 添加按钮 */}
                    <div className="flex justify-center gap-3">
                      <label className="cursor-pointer">
                        <div className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                          <FileIcon className="w-4 h-4" />
                          <span>添加文件</span>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setFiles([...files, ...Array.from(e.target.files)]);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      <label className="cursor-pointer">
                        <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                          <FolderIcon className="w-4 h-4" />
                          <span>添加文件夹</span>
                        </div>
                        <input
                          type="file"
                          // @ts-ignore
                          webkitdirectory=""
                          directory=""
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const fileList = Array.from(e.target.files);
                              const firstFile = fileList[0];
                              // @ts-ignore - webkitRelativePath exists
                              const relativePath = firstFile.webkitRelativePath || firstFile.name;
                              const folderName = relativePath.split('/')[0];

                              setFolders([...folders, {
                                name: folderName,
                                files: fileList
                              }]);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 已选文件和文件夹列表 */}
                  {(files.length > 0 || folders.length > 0) && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          已添加 {files.length} 个文件, {folders.length} 个文件夹
                          <span className="ml-2 text-gray-500">
                            ({(
                              (files.reduce((sum, f) => sum + f.size, 0) +
                              folders.reduce((sum, folder) =>
                                sum + folder.files.reduce((s, f) => s + f.size, 0), 0
                              )) / 1024 / 1024
                            ).toFixed(2)} MB)
                          </span>
                        </p>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            setFiles([]);
                            setFolders([]);
                          }}
                        >
                          清除全部
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {/* 显示文件夹 */}
                        {folders.map((folder, index) => (
                          <div key={`folder-${index}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                            <FolderIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate font-medium">{folder.name}</p>
                              <p className="text-xs text-gray-500">
                                {folder.files.length} 个文件 · {(folder.files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              size="sm"
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() => {
                                setFolders(folders.filter((_, i) => i !== index));
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {/* 显示单个文件 */}
                        {files.map((file, index) => (
                          <div key={`file-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              size="sm"
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() => {
                                setFiles(files.filter((_, i) => i !== index));
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span>💡</span>
                    <span>提示：可以多次添加文件或文件夹，建议上传 README.md 文件用于展示详细说明</span>
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                uploadModal.onClose();
                resetForm();
              }}
            >
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleUpload}
              isLoading={uploadingFiles}
              isDisabled={!formData.code || !formData.name || !formData.englishName || !formData.categoryCode}
            >
              {uploadingFiles ? '上传中...' : '上传'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
