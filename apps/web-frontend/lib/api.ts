import axios from 'axios';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 创建axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  // 用户登录
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),

  // 获取当前用户信息
  me: () => api.get('/auth/me'),

  // 生成API密钥
  generateApiKey: () => api.post('/auth/api-key/generate'),
};

// 数据集相关API
export const datasetAPI = {
  // 获取数据集列表
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }) => api.get('/datasets', { params }),

  // 获取单个数据集详情
  get: (id: string) => api.get(`/datasets/${id}`),

  // 上传数据集
  upload: (formData: FormData) =>
    api.post('/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // 更新数据集
  update: (id: string, data: any) => api.put(`/datasets/${id}`, data),

  // 删除数据集
  delete: (id: string) => api.delete(`/datasets/${id}`),

  // 预览数据集
  preview: (id: string, rows?: number) =>
    api.get(`/datasets/${id}/preview`, { params: { rows } }),

  // 下载数据集
  download: (id: string) => {
    window.open(`${API_BASE_URL}/api/datasets/${id}/download`, '_blank');
  },

  // 数据可视化
  visualize: (id: string, params: any) =>
    api.post(`/datasets/${id}/visualize`, params),

  // 数据分析
  analyze: (id: string, params: any) =>
    api.post(`/datasets/${id}/analyze`, params),
};

// 用户管理相关API (管理员)
export const userAPI = {
  // 获取用户列表
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get('/users', { params }),

  // 获取单个用户详情
  get: (id: string) => api.get(`/users/${id}`),

  // 更新用户角色
  updateRole: (id: string, role: 'admin' | 'user') =>
    api.put(`/users/${id}/role`, { role }),

  // 删除用户
  delete: (id: string) => api.delete(`/users/${id}`),

  // 获取用户的数据集
  getUserDatasets: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${id}/datasets`, { params }),

  // 获取平台统计信息
  getStats: () => api.get('/users/stats/overview'),
};

// 工具函数
export const utils = {
  // 格式化文件大小
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 格式化日期
  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // 验证邮箱格式
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 获取文件类型图标
  getFileTypeIcon: (fileType: string): string => {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return '📊';
      case 'xlsx':
      case 'xls':
        return '📈';
      case 'json':
        return '📋';
      case 'txt':
        return '📝';
      default:
        return '📄';
    }
  },
};

export default api; 