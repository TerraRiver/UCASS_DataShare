'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoginForm } from '../../../components/auth/AdminLoginForm';
import { useAuth } from '../../../components/auth/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    // 如果已经是管理员，重定向到管理面板
    if (isAuthenticated && isAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleLoginSuccess = () => {
    // 登录成功后跳转到管理面板
    router.push('/admin');
  };

  const handleCancel = () => {
    // 取消登录，返回首页
    router.push('/');
  };

  return (
    <AdminLoginForm 
      onSuccess={handleLoginSuccess}
      onCancel={handleCancel}
    />
  );
} 