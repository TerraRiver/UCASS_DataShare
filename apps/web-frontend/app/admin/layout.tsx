'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@nextui-org/react';
import { HomeIcon, LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                 <span className="text-sm font-bold text-white">UD</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button as={Link} href="/" variant="flat" startContent={<HomeIcon className="h-4 w-4" />}>
                返回首页
              </Button>
              <Button variant="light" color="danger" onClick={handleLogout} startContent={<LogOutIcon className="h-4 w-4" />}>
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
} 