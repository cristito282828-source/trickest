'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Button } from '@nextui-org/react';
import { Select, SelectItem } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { MdPeople, MdAdminPanelSettings, MdGavel, MdOutlineSkateboarding, MdSearch } from 'react-icons/md';
import Image from 'next/image';

interface User {
  id: number;
  email: string;
  name: string;
  photo: string;
  role: string;
  profileStatus: string;
  createdAt: string;
  totalSubmissions: number;
  totalScore: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    role: 'all',
    search: '',
    registeredIn: 'all',
    hasSubmissions: 'all',
    orderBy: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.role !== 'all') params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      if (filters.registeredIn !== 'all') params.append('registeredIn', filters.registeredIn);
      if (filters.hasSubmissions !== 'all') params.append('hasSubmissions', filters.hasSubmissions);
      params.append('orderBy', filters.orderBy);
      params.append('order', filters.order);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      console.log('🔍 Frontend filters:', filters);
      console.log('📤 Fetching with params:', params.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: number, newRole: string) => {
    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'updateRole', newRole }),
      });

      if (response.ok) {
        // Refresh the users list
        fetchUsers();
      } else {
        console.error('Error updating user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
    setUpdating(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <MdAdminPanelSettings size={20} className="text-red-400" />;
      case 'judge': return <MdGavel size={20} className="text-accent-yellow-400" />;
      default: return <MdOutlineSkateboarding size={20} className="text-accent-cyan-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'from-red-500 to-accent-orange-500',
      judge: 'from-accent-yellow-500 to-accent-amber-500',
      skater: 'from-accent-cyan-500 to-accent-blue-500',
    };

    return (
      <span className={`text-xs bg-gradient-to-r ${colors[role as keyof typeof colors]} text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg`}>
        {role}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-2">
          {`👥 ${t('title')}`}
        </h1>
        <p className="text-neutral-600 text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-900 border-4 border-neutral-700">
        <CardHeader>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            {`🔍 ${t('filters')}`}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <Input
                label={t('search')}
                placeholder={t('searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  search: e.target.value,
                  page: 1
                }))}
                className="text-white"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 focus-within:!border-neutral-600"
                }}
                style={{ color: 'white' }}
              />
            </div>

            {/* Role Filter */}
            <Select
              label={t('role')}
              placeholder={t('allRoles')}
              selectedKeys={[filters.role]}
              onSelectionChange={(keys) => setFilters(prev => ({
                ...prev,
                role: Array.from(keys)[0] as string,
                page: 1
              }))}
              classNames={{
                trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                value: "text-white",
                listbox: "bg-neutral-800",
                popoverContent: "bg-neutral-800"
              }}
              style={{ color: 'white' }}
            >
              <SelectItem key="all" value="all" className="text-white">{t('all')}</SelectItem>
              <SelectItem key="skater" value="skater" className="text-white">{t('skater')}</SelectItem>
              <SelectItem key="judge" value="judge" className="text-white">{t('judge')}</SelectItem>
              <SelectItem key="admin" value="admin" className="text-white">{t('admin')}</SelectItem>
            </Select>

            {/* Registered In Filter */}
            <Select
              label={t('registeredIn')}
              placeholder={t('allTime')}
              selectedKeys={[filters.registeredIn]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                console.log('🔄 RegisteredIn selection changed:', { keys: Array.from(keys), value });
                setFilters(prev => ({
                  ...prev,
                  registeredIn: value,
                  page: 1
                }));
              }}
              classNames={{
                trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                value: "text-white",
                listbox: "bg-neutral-800",
                popoverContent: "bg-neutral-800"
              }}
              style={{ color: 'white' }}
            >
              <SelectItem key="all" value="all" className="text-white">{t('allTime')}</SelectItem>
              <SelectItem key="today" value="today" className="text-white">{t('today')}</SelectItem>
              <SelectItem key="week" value="week" className="text-white">{t('lastWeek')}</SelectItem>
              <SelectItem key="month" value="month" className="text-white">{t('thisMonth')}</SelectItem>
              <SelectItem key="3months" value="3months" className="text-white">{t('last3Months')}</SelectItem>
            </Select>

            {/* Submissions Filter */}
            <Select
              label={t('submissionsFilter')}
              placeholder={t('all')}
              selectedKeys={[filters.hasSubmissions]}
              onSelectionChange={(keys) => setFilters(prev => ({
                ...prev,
                hasSubmissions: Array.from(keys)[0] as string,
                page: 1
              }))}
              classNames={{
                trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                value: "text-white",
                listbox: "bg-neutral-800",
                popoverContent: "bg-neutral-800"
              }}
              style={{ color: 'white' }}
            >
              <SelectItem key="all" value="all" className="text-white">{t('all')}</SelectItem>
              <SelectItem key="true" value="true" className="text-white">{t('withSubmissions')}</SelectItem>
              <SelectItem key="false" value="false" className="text-white">{t('withoutSubmissions')}</SelectItem>
            </Select>

            {/* Order By */}
            <Select
              label={t('orderBy')}
              placeholder={t('orderBy')}
              selectedKeys={[filters.orderBy]}
              onSelectionChange={(keys) => setFilters(prev => ({
                ...prev,
                orderBy: Array.from(keys)[0] as string,
                page: 1
              }))}
              classNames={{
                trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                value: "text-white",
                listbox: "bg-neutral-800",
                popoverContent: "bg-neutral-800"
              }}
              style={{ color: 'white' }}
            >
              <SelectItem key="createdAt" value="createdAt" className="text-white">{t('newest')}</SelectItem>
              <SelectItem key="name" value="name" className="text-white">{t('name')}</SelectItem>
              <SelectItem key="score" value="score" className="text-white">{t('score')}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Users List */}
      <Card className="bg-neutral-900 border-4 border-neutral-700">
        <CardHeader>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            {`👤 ${t('users')} (${pagination.total})`}
          </h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan-400"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-gradient-to-r from-neutral-800 to-neutral-700 p-4 rounded-lg border border-neutral-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 rounded-full blur-sm"></div>
                        <Image
                          className="relative rounded-full w-12 h-12 border-2 border-white"
                          src={user.photo || "/logo.png"}
                          alt={user.name || 'User'}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{user.name || t('noName')}</h4>
                        <p className="text-neutral-400 text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(user.role)}
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('submissions')}</p>
                        <p className="text-2xl font-black text-accent-cyan-400">{user.totalSubmissions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('scoreTotal')}</p>
                        <p className="text-2xl font-black text-accent-yellow-400">{user.totalScore}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Select
                          size="sm"
                          placeholder={t('changeRole')}
                          selectedKeys={[user.role]}
                          onSelectionChange={(keys) => {
                            const newRole = Array.from(keys)[0] as string;
                            if (newRole !== user.role) {
                              updateUserRole(user.id, newRole);
                            }
                          }}
                          disabled={updating === user.id}
                          className="w-40"
                          classNames={{
                            trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                            value: "text-white",
                            listbox: "bg-neutral-800",
                            popoverContent: "bg-neutral-800"
                          }}
                          style={{ color: 'white' }}
                        >
                          <SelectItem key="skater" value="skater" className="text-white">{t('skater')}</SelectItem>
                          <SelectItem key="judge" value="judge" className="text-white">{t('judge')}</SelectItem>
                          <SelectItem key="admin" value="admin" className="text-white">{t('admin')}</SelectItem>
                        </Select>
                        {updating === user.id && (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent-cyan-400"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-400 text-lg">{t('noUsersFound')}</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            disabled={pagination.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 text-white font-bold"
          >
            {t('previous')}
          </Button>

          <span className="flex items-center px-4 py-2 bg-neutral-800 text-white rounded-lg">
            {t('page', { page: pagination.page, pages: pagination.pages })}
          </span>

          <Button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 text-white font-bold"
          >
            {t('next')}
          </Button>
        </div>
      )}
    </div>
  );
}