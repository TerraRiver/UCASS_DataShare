'use client'

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Chip, Divider } from '@nextui-org/react';
import { Key, Save, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
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

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [originalApiKey, setOriginalApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setHasChanges(apiKey !== originalApiKey);
  }, [apiKey, originalApiKey]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('http://localhost:30002/api/admin/settings/DEEPSEEK_API_KEY', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        const setting: Setting = await response.json();
        setApiKey(setting.value);
        setOriginalApiKey(setting.value);
      } else if (response.status === 404) {
        // API key 未配置
        setApiKey('');
        setOriginalApiKey('');
      } else {
        const error = await response.json().catch(() => ({ error: '获取配置失败' }));
        toast.error(error.error || '获取配置失败');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('网络错误：请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('API Key 不能为空');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('http://localhost:30002/api/admin/settings/DEEPSEEK_API_KEY', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: apiKey,
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
        const data = await response.json();
        toast.success('API Key 已保存');
        setOriginalApiKey(apiKey);
        setTestResult(null);
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
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('请先输入 API Key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        toast.error('请先登录');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('http://localhost:30002/api/admin/settings/test-api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
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
        setTestResult(result);
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
      setTesting(false);
    }
  };

  const handleReset = () => {
    setApiKey(originalApiKey);
    setTestResult(null);
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
          管理系统API密钥和相关配置
        </p>
      </div>

      {/* API Key Configuration */}
      <div className="max-w-4xl">
        <Card className="border-2 border-gray-100">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">DeepSeek API 配置</h3>
                  <p className="text-sm text-gray-600">用于 RAG 智能搜索和 AI 助手功能</p>
                </div>
              </div>
              <Chip
                color={originalApiKey ? "success" : "warning"}
                variant="flat"
                size="sm"
              >
                {originalApiKey ? '已配置' : '未配置'}
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">关于 DeepSeek API</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 访问 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">platform.deepseek.com</a> 注册并获取API密钥</li>
                    <li>• API密钥格式类似：sk-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                    <li>• 配置后将用于向量化和智能对话功能</li>
                    <li>• 已保存的密钥会被脱敏显示（仅显示前4位和后4位）</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  classNames={{
                    input: "font-mono text-sm",
                    inputWrapper: "border-2 border-gray-200"
                  }}
                  startContent={<Key className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              {hasChanges && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  API Key 已修改，请保存或测试后再保存
                </p>
              )}
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`rounded-lg p-4 border-2 ${
                testResult.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    testResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <Divider />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  color="primary"
                  startContent={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  isLoading={saving}
                  isDisabled={!apiKey.trim() || !hasChanges}
                >
                  保存配置
                </Button>
                <Button
                  variant="bordered"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onClick={handleTest}
                  isLoading={testing}
                  isDisabled={!apiKey.trim()}
                >
                  测试连接
                </Button>
                {hasChanges && (
                  <Button
                    variant="light"
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                )}
              </div>

              <Button
                variant="flat"
                startContent={<RefreshCw className="w-4 h-4" />}
                onClick={fetchSettings}
              >
                刷新
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Usage Guide */}
        <Card className="mt-6 border-2 border-gray-100">
          <CardBody className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 配置说明</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• <strong>保存配置</strong>：将 API Key 保存到数据库，配置立即生效</li>
              <li>• <strong>测试连接</strong>：验证 API Key 是否有效，建议保存前先测试</li>
              <li>• <strong>安全性</strong>：API Key 加密存储，仅管理员可见</li>
              <li>• <strong>优先级</strong>：如果 .env 文件中也配置了 DEEPSEEK_API_KEY，将优先使用 .env 中的配置</li>
              <li>• <strong>生效范围</strong>：配置后影响 AI 智能助手、智能搜索、RAG 向量化等所有 AI 功能</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
