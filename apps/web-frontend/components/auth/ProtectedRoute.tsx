'use client'

import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { AdminLoginForm } from './AdminLoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  showLoginModal?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  fallback,
  showLoginModal = false,
}) => {
  const { isAuthenticated, isAdmin, loading, checkAuthStatus } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      await checkAuthStatus();
      setIsChecking(false);
    };
    
    checkAuth();
  }, [checkAuthStatus]);

  // 正在检查认证状态
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">检查认证状态...</p>
        </div>
      </div>
    );
  }

  // 如果需要管理员权限但用户不是管理员
  if (requireAdmin && !isAdmin) {
    if (showLoginModal) {
      return (
        <>
          {showLogin && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <AdminLoginForm
                onSuccess={() => setShowLogin(false)}
                onCancel={() => setShowLogin(false)}
              />
            </div>
          )}
          
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
              <div>
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  需要管理员权限
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  此功能仅限管理员使用，请先登录管理员账户
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  管理员登录
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  返回上一页
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }

    // 显示自定义的fallback或默认的无权限页面
    if (fallback) {
      return <>{fallback}</>;
    }

    return <AdminLoginForm onSuccess={() => window.location.reload()} />;
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>;
};

// 管理员功能包装组件
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// 认证状态指示器组件
export const AuthIndicator: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="flex items-center space-x-1">
        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
        <span className="text-gray-600">管理员: {user?.username}</span>
      </div>
      
      <button
        onClick={logout}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="注销"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}; 