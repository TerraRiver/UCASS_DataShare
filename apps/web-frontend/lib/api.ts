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

// 请求拦截器 - 添加认证token和匿名用户ID
api.interceptors.request.use(
  (config) => {
    // 添加管理员token
    const token = localStorage.getItem('ucass_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加匿名用户ID
    const anonymousId = localStorage.getItem('ucass_anonymous_id');
    if (anonymousId) {
      config.headers['X-Anonymous-Id'] = anonymousId;
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
      // 仅在访问管理员功能时清除认证信息
      const isAdminRoute = error.config?.url?.includes('/admin') || 
                          error.config?.url?.includes('/auth/admin');
      
      if (isAdminRoute) {
        localStorage.removeItem('ucass_admin_token');
        localStorage.removeItem('ucass_admin_user');
        // 可以选择跳转到管理员登录页面
        // window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证相关API
export const authAPI = {
  // 管理员登录
  adminLogin: (data: { username: string; password: string }) =>
    api.post('/auth/admin/login', data),

  // 管理员注销
  adminLogout: () => api.post('/auth/admin/logout'),

  // 检查管理员状态
  adminStatus: () => api.get('/auth/admin/status'),

  // 获取匿名用户标识
  getAnonymousId: () => api.post('/auth/anonymous'),

  // 获取当前用户信息
  me: () => api.get('/auth/me'),
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