'use client';

import { useState, useEffect, FC } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Spinner,
  Tooltip,
} from '@nextui-org/react';
import { EditIcon, TrashIcon, PlusIcon, KeyRoundIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

interface Admin {
  id: string;
  username: string;
  createdAt: string;
}

const API_BASE_URL = '/api/admin';

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // States for modals
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // State for forms
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchAdmins = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_token');
          router.push('/admin/login');
        }
        throw new Error('获取管理员列表失败');
      }
      
      const data = await response.json();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAdmins();
  }, [router]);

  const handleCreateAdmin = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newAdminUsername, password: newAdminPassword }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '创建失败');
      }

      toast.success('管理员创建成功！');
      setNewAdminUsername('');
      setNewAdminPassword('');
      onCreateClose();
      fetchAdmins(); // Refresh list
    } catch (err: any) {
      toast.error(`创建失败: ${err.message}`);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedAdmin) return;
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedAdmin.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '密码更新失败');
      }
      
      toast.success('密码更新成功！');
      setNewPassword('');
      onEditClose();
    } catch (err: any) {
      toast.error(`更新失败: ${err.message}`);
    }
  };
  
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '删除失败');
      }
      
      toast.success('管理员删除成功！');
      onDeleteClose();
      fetchAdmins(); // Refresh list
    } catch (err: any) {
      toast.error(`删除失败: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner label="加载中..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-danger">错误: {error}</div>;
  }

  return (
    <div>
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">管理员账号管理</h1>
        <Button color="primary" startContent={<PlusIcon />} onClick={onCreateOpen}>
          创建管理员
        </Button>
      </div>
      <Table aria-label="管理员列表">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>用户名</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody items={admins} emptyContent="暂无管理员账号">
          {(item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs text-gray-500">{item.id}</TableCell>
              <TableCell>{item.username}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
              <TableCell className="flex gap-2">
                <Tooltip content="修改密码">
                  <Button isIconOnly variant="light" onClick={() => { setSelectedAdmin(item); setNewPassword(''); onEditOpen(); }}>
                    <KeyRoundIcon className="h-5 w-5 text-yellow-600" />
                  </Button>
                </Tooltip>
                <Tooltip content="删除账号">
                  <Button isIconOnly variant="light" color="danger" onClick={() => { setSelectedAdmin(item); onDeleteOpen(); }}>
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Create Admin Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalContent>
          <ModalHeader>创建新管理员</ModalHeader>
          <ModalBody>
            <Input
              label="用户名"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
            />
            <Input
              label="密码"
              type="password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onCreateClose}>取消</Button>
            <Button color="primary" onClick={handleCreateAdmin}>创建</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Password Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalContent>
          <ModalHeader>为 {selectedAdmin?.username} 修改密码</ModalHeader>
          <ModalBody>
            <Input
              label="新密码"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => { setNewPassword(''); onEditClose(); }}>取消</Button>
            <Button color="primary" onClick={handleUpdatePassword}>更新密码</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Admin Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>确认删除</ModalHeader>
          <ModalBody>
            <p>您确定要删除管理员 <span className="font-bold">{selectedAdmin?.username}</span> 吗？此操作无法撤销。</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onDeleteClose}>取消</Button>
            <Button color="danger" onClick={handleDeleteAdmin}>删除</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 