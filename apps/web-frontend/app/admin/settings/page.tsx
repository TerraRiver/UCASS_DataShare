'use client'

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Chip, Divider } from '@nextui-org/react';
import { Key, Save, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiKeyState {
  value: string;
  original: string;
  show: boolean;
  saving: boolean;
  testing: boolean;
  testResult: { valid: boolean; message: string } | null;
}

export default function SettingsPage() {
  const [embeddingKey, setEmbeddingKey] = useState<ApiKeyState>({
    value: '',
    original: '',
    show: false,
    saving: false,
    testing: false,
    testResult: null
  });

  const [chatKey, setChatKey] = useState<ApiKeyState>({
    value: '',
    original: '',
    show: false,
    saving: false,
    testing: false,
    testResult: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      // 获取 Embedding API Key
      const embeddingRes = await fetch('/api/admin/settings/QWEN_EMBEDDING_API_KEY', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 获取 Chat API Key
      const chatRes = await fetch('/api/admin/settings/QWEN_CHAT_API_KEY', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (embeddingRes.status === 401 || chatRes.status === 401) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
        return;
      }

      // 处理 Embedding API Key
      if (embeddingRes.ok) {
        const setting: Setting = await embeddingRes.json();
        setEmbeddingKey(prev => ({
          ...prev,
          value: setting.value,
          original: setting.value
        }));
      } else if (embeddingRes.status === 404) {
        setEmbeddingKey(prev => ({
          ...prev,
          value: '',
          original: ''
        }));
      }

      // 处理 Chat API Key
      if (chatRes.ok) {
        const setting: Setting = await chatRes.json();
        setChatKey(prev => ({
          ...prev,
          value: setting.value,
          original: setting.value
        }));
      } else if (chatRes.status === 404) {
        setChatKey(prev => ({
          ...prev,
          value: '',
          original: ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('网络错误：请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: 'embedding' | 'chat') => {
    const state = type === 'embedding' ? embeddingKey : chatKey;
    const setState = type === 'embedding' ? setEmbeddingKey : setChatKey;
    const settingKey = type === 'embedding' ? 'QWEN_EMBEDDING_API_KEY' : 'QWEN_CHAT_API_KEY';

    if (!state.value.trim()) {
      toast.error('API Key 不能为空');
      return;
    }

    setState(prev => ({ ...prev, saving: true }));
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`/api/admin/settings/${settingKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: state.value,
          category: 'api',
          isSecret: true
        })
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
        return;
      }

      if (response.ok) {
        toast.success('API Key 已保存');
        setState(prev => ({
          ...prev,
          original: state.value,
          testResult: null
        }));
        // 刷新页面以获取脱敏后的值
        await fetchSettings();
      } else {
        const error = await response.json().catch(() => ({ error: '保存失败' }));
        toast.error(error.error || '保存失败');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('网络错误：请确认后端服务已启动');
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleTest = async (type: 'embedding' | 'chat') => {
    const state = type === 'embedding' ? embeddingKey : chatKey;
    const setState = type === 'embedding' ? setEmbeddingKey : setChatKey;

    if (!state.value.trim()) {
      toast.error('请先输入 API Key');
      return;
    }

    setState(prev => ({ ...prev, testing: true, testResult: null }));
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('/api/admin/settings/test-qwen-api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: state.value,
          type: type
        })
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({ ...prev, testResult: result }));
        if (result.valid) {
          toast.success('API Key 有效');
        } else {
          toast.error(result.message);
        }
      } else {
        const error = await response.json().catch(() => ({ error: '测试失败' }));
        toast.error(error.error || '测试失败');
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('网络错误：请确认后端服务已启动');
    } finally {
      setState(prev => ({ ...prev, testing: false }));
    }
  };

  const handleReset = (type: 'embedding' | 'chat') => {
    const state = type === 'embedding' ? embeddingKey : chatKey;
    const setState = type === 'embedding' ? setEmbeddingKey : setChatKey;

    setState(prev => ({
      ...prev,
      value: state.original,
      testResult: null
    }));
  };

  const hasChanges = (type: 'embedding' | 'chat') => {
    const state = type === 'embedding' ? embeddingKey : chatKey;
    return state.value !== state.original;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-2"
            style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}>
          系统配置
        </h1>
        <p className="text-gray-600">
          管理 Qwen 模型 API 密钥和相关配置
        </p>
      </div>

      {/* API Keys Configuration */}
      <div className="max-w-4xl space-y-6">
        {/* Embedding API Key Card */}
        <Card className="border-2 border-gray-100">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Qwen Embedding API 配置</h3>
                  <p className="text-sm text-gray-600">text-embedding-v4 模型 - 用于向量化和语义搜索</p>
                </div>
              </div>
              <Chip
                color={embeddingKey.original ? "success" : "warning"}
                variant="flat"
                size="sm"
              >
                {embeddingKey.original ? '已配置' : '未配置'}
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">关于 Qwen Embedding API</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 访问 <a href="https://bailian.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">阿里云百炼控制台</a> 获取 API Key</li>
                    <li>• 模型：text-embedding-v4（高性能文本向量化）</li>
                    <li>• 用途：数据集和案例集的向量化、语义搜索</li>
                    <li>• API Key 格式：sk-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Embedding API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type={embeddingKey.show ? "text" : "password"}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={embeddingKey.value}
                  onChange={(e) => setEmbeddingKey(prev => ({ ...prev, value: e.target.value }))}
                  classNames={{
                    input: "font-mono text-sm",
                    inputWrapper: "border-2 border-gray-200"
                  }}
                  startContent={<Key className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setEmbeddingKey(prev => ({ ...prev, show: !prev.show }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {embeddingKey.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              {hasChanges('embedding') && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  API Key 已修改，请保存或测试后再保存
                </p>
              )}
            </div>

            {/* Test Result */}
            {embeddingKey.testResult && (
              <div className={`rounded-lg p-4 border-2 ${
                embeddingKey.testResult.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {embeddingKey.testResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    embeddingKey.testResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {embeddingKey.testResult.message}
                  </span>
                </div>
              </div>
            )}

            <Divider />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                color="primary"
                startContent={<Save className="w-4 h-4" />}
                onClick={() => handleSave('embedding')}
                isLoading={embeddingKey.saving}
                isDisabled={!embeddingKey.value.trim() || !hasChanges('embedding')}
              >
                保存配置
              </Button>
              <Button
                variant="bordered"
                startContent={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleTest('embedding')}
                isLoading={embeddingKey.testing}
                isDisabled={!embeddingKey.value.trim()}
              >
                测试连接
              </Button>
              {hasChanges('embedding') && (
                <Button
                  variant="light"
                  onClick={() => handleReset('embedding')}
                >
                  重置
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Chat API Key Card */}
        <Card className="border-2 border-gray-100">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Qwen Chat API 配置</h3>
                  <p className="text-sm text-gray-600">qwen-plus-2025-07-28 模型 - 用于 AI 对话和生成</p>
                </div>
              </div>
              <Chip
                color={chatKey.original ? "success" : "warning"}
                variant="flat"
                size="sm"
              >
                {chatKey.original ? '已配置' : '未配置'}
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">关于 Qwen Chat API</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 访问 <a href="https://bailian.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">阿里云百炼控制台</a> 获取 API Key</li>
                    <li>• 模型：qwen-plus-2025-07-28（强大的对话生成能力）</li>
                    <li>• 用途：智能问答、AI 助手、内容生成</li>
                    <li>• API Key 格式：sk-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Chat API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type={chatKey.show ? "text" : "password"}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={chatKey.value}
                  onChange={(e) => setChatKey(prev => ({ ...prev, value: e.target.value }))}
                  classNames={{
                    input: "font-mono text-sm",
                    inputWrapper: "border-2 border-gray-200"
                  }}
                  startContent={<Key className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setChatKey(prev => ({ ...prev, show: !prev.show }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {chatKey.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              {hasChanges('chat') && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  API Key 已修改，请保存或测试后再保存
                </p>
              )}
            </div>

            {/* Test Result */}
            {chatKey.testResult && (
              <div className={`rounded-lg p-4 border-2 ${
                chatKey.testResult.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {chatKey.testResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    chatKey.testResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {chatKey.testResult.message}
                  </span>
                </div>
              </div>
            )}

            <Divider />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                color="primary"
                startContent={<Save className="w-4 h-4" />}
                onClick={() => handleSave('chat')}
                isLoading={chatKey.saving}
                isDisabled={!chatKey.value.trim() || !hasChanges('chat')}
              >
                保存配置
              </Button>
              <Button
                variant="bordered"
                startContent={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleTest('chat')}
                isLoading={chatKey.testing}
                isDisabled={!chatKey.value.trim()}
              >
                测试连接
              </Button>
              {hasChanges('chat') && (
                <Button
                  variant="light"
                  onClick={() => handleReset('chat')}
                >
                  重置
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onClick={fetchSettings}
          >
            刷新配置
          </Button>
        </div>

        {/* Usage Guide */}
        <Card className="border-2 border-gray-100">
          <CardBody className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 配置说明</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• <strong>两个独立的 API Key</strong>：Embedding 和 Chat 使用不同的 API Key，请分别配置</li>
              <li>• <strong>保存配置</strong>：将 API Key 保存到数据库，配置立即生效</li>
              <li>• <strong>测试连接</strong>：验证 API Key 是否有效，建议保存前先测试</li>
              <li>• <strong>安全性</strong>：API Key 加密存储，仅管理员可见，已保存的密钥会被脱敏显示</li>
              <li>• <strong>优先级</strong>：如果 .env 文件中也配置了相应的 API Key，将优先使用 .env 中的配置</li>
              <li>• <strong>生效范围</strong>：
                <ul className="ml-4 mt-1 space-y-1">
                  <li>- Embedding API：数据集/案例集向量化、语义搜索</li>
                  <li>- Chat API：AI 智能助手、智能问答、内容生成</li>
                </ul>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
