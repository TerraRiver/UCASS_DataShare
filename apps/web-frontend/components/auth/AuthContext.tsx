'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../../lib/api';

// 类型定义
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  anonymousId: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_ANONYMOUS_ID'; payload: string }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  generateAnonymousId: () => Promise<void>;
  clearError: () => void;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  anonymousId: null,
  loading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isAdmin: action.payload.user.role === 'admin',
        loading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null,
      };

    case 'SET_ANONYMOUS_ID':
      return {
        ...state,
        anonymousId: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook 用于访问认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
};

// AuthProvider 组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 从本地存储恢复认证状态
  useEffect(() => {
    const token = localStorage.getItem('ucass_admin_token');
    const userStr = localStorage.getItem('ucass_admin_user');
    const anonymousId = localStorage.getItem('ucass_anonymous_id');

    if (anonymousId) {
      dispatch({ type: 'SET_ANONYMOUS_ID', payload: anonymousId });
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('ucass_admin_token');
        localStorage.removeItem('ucass_admin_user');
      }
    }
  }, []);

  // 管理员登录
  const login = async (credentials: { username: string; password: string }): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authAPI.adminLogin(credentials);
      const { user, token } = response as any;

      // 存储到本地存储
      localStorage.setItem('ucass_admin_token', token);
      localStorage.setItem('ucass_admin_user', JSON.stringify(user));

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || '登录失败';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // 管理员注销
  const logout = async (): Promise<void> => {
    try {
      if (state.isAuthenticated) {
        await authAPI.adminLogout();
      }
    } catch (error) {
      console.error('注销请求失败:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('ucass_admin_token');
      localStorage.removeItem('ucass_admin_user');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // 检查认证状态
  const checkAuthStatus = async (): Promise<void> => {
    if (!state.token) return;

    try {
      const response = await authAPI.adminStatus();
      if (!(response as any).isAdmin) {
        // 如果不是管理员，清除认证状态
        await logout();
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      await logout();
    }
  };

  // 生成匿名用户ID
  const generateAnonymousId = async (): Promise<void> => {
    try {
      const response = await authAPI.getAnonymousId();
      const anonymousId = (response as any).anonymousId;
      
      localStorage.setItem('ucass_anonymous_id', anonymousId);
      dispatch({ type: 'SET_ANONYMOUS_ID', payload: anonymousId });
    } catch (error) {
      console.error('生成匿名用户ID失败:', error);
    }
  };

  // 清除错误
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuthStatus,
    generateAnonymousId,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 