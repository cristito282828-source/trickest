'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Select, SelectItem } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { MdShoppingCart, MdVisibility, MdSearch } from 'react-icons/md';
import { Button } from '@/components/atoms';
import { Link } from '@/i18n/routing';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string | null;
  productSlug: string;
  quantity: number;
}

interface Order {
  id: number;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes: string | null;
  shippingGuideUrl: string | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export default function AdminOrdersPage() {
  const t = useTranslations('adminOrdersPage');
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [appliedEmail, setAppliedEmail] = useState<string>('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const all: Order[] = data.data?.orders ?? [];
        setOrders(all);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    if (!appliedEmail.trim()) return orders;
    const q = appliedEmail.toLowerCase();
    return orders.filter((o) => o.customerEmail.toLowerCase().includes(q));
  }, [orders, appliedEmail]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    return { total, pending, confirmed, shipped };
  }, [orders]);

  const handleSearch = () => {
    setAppliedEmail(emailFilter.trim());
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setEmailFilter('');
    setAppliedEmail('');
  };

  const getStatusBadge = (status: Order['status']) => {
    const gradients: Record<Order['status'], string> = {
      pending: 'from-accent-yellow-500 to-accent-orange-500',
      confirmed: 'from-accent-cyan-500 to-accent-blue-500',
      shipped: 'from-accent-purple-500 to-accent-pink-500',
      delivered: 'from-green-500 to-accent-teal-500',
      cancelled: 'from-red-500 to-accent-pink-500',
    };
    return (
      <span className={`text-xs bg-gradient-to-r ${gradients[status]} text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg`}>
        {t(`filters.status_${status}`)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MdShoppingCart className="text-cyan-400" size={32} />
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider">
              {t('title')}
            </h1>
          </div>
          <p className="text-cyan-300 text-sm md:text-base">{t('subtitle')}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-slate-900 border-2 border-slate-700">
            <CardBody className="p-4 md:p-5">
              <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                {t('stats.totalOrders')}
              </p>
              <p className="text-3xl md:text-4xl font-black text-white">{stats.total}</p>
            </CardBody>
          </Card>
          <Card className="bg-slate-900 border-2 border-accent-yellow-500/50">
            <CardBody className="p-4 md:p-5">
              <p className="text-accent-yellow-400 text-xs uppercase font-bold tracking-wider mb-1">
                {t('stats.pending')}
              </p>
              <p className="text-3xl md:text-4xl font-black text-accent-yellow-400">{stats.pending}</p>
            </CardBody>
          </Card>
          <Card className="bg-slate-900 border-2 border-accent-cyan-500/50">
            <CardBody className="p-4 md:p-5">
              <p className="text-accent-cyan-400 text-xs uppercase font-bold tracking-wider mb-1">
                {t('stats.confirmed')}
              </p>
              <p className="text-3xl md:text-4xl font-black text-accent-cyan-400">{stats.confirmed}</p>
            </CardBody>
          </Card>
          <Card className="bg-slate-900 border-2 border-accent-purple-500/50">
            <CardBody className="p-4 md:p-5">
              <p className="text-accent-purple-400 text-xs uppercase font-bold tracking-wider mb-1">
                {t('stats.shipped')}
              </p>
              <p className="text-3xl md:text-4xl font-black text-accent-purple-400">{stats.shipped}</p>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-2 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700 p-4">
            <p className="text-white font-black uppercase tracking-wider text-sm">
              {t('filters.title')}
            </p>
          </CardHeader>
          <CardBody className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label={t('filters.status')}
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => {
                  const v = Array.from(keys)[0] as string;
                  setStatusFilter(v);
                }}
                classNames={{ trigger: 'bg-slate-800' }}
                size="sm"
              >
                <>
                  <SelectItem key="all">{t('filters.allStatuses')}</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s}>{t(`filters.status_${s}`)}</SelectItem>
                  ))}
                </>
              </Select>

              <Input
                type="email"
                label={t('filters.customerEmail')}
                placeholder={t('filters.customerEmailPlaceholder')}
                value={emailFilter}
                onValueChange={setEmailFilter}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                classNames={{ inputWrapper: 'bg-slate-800' }}
                size="sm"
                startContent={<MdSearch className="text-slate-400" />}
              />

              <div className="flex gap-2 items-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSearch}
                  leftIcon={<MdSearch size={18} />}
                >
                  {t('filters.title')}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleClearFilters}
                >
                  {t('filters.clearFilters')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Orders list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="bg-slate-900 border-2 border-slate-700">
            <CardBody className="p-12 text-center">
              <MdShoppingCart className="text-slate-600 mx-auto mb-3" size={64} />
              <p className="text-slate-500 text-lg">{t('list.empty')}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="bg-slate-900 border-2 border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <CardBody className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    {/* ID + status */}
                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                      <span className="text-cyan-400 font-black text-lg">
                        #{order.id}
                      </span>
                      {getStatusBadge(order.status)}
                      {order.shippingGuideUrl && (
                        <span
                          className="text-[10px] bg-accent-purple-500/20 border border-accent-purple-400 text-accent-purple-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap"
                          title={t('list.hasGuide')}
                        >
                          📦 {t('list.hasGuide')}
                        </span>
                      )}
                    </div>

                    {/* Customer info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">
                        {order.customerName}
                      </p>
                      <p className="text-slate-400 text-sm truncate">
                        {order.customerEmail}
                      </p>
                      {!order.userId && (
                        <p className="text-accent-orange-400 text-xs mt-1">
                          {t('list.guestOrder')}
                        </p>
                      )}
                    </div>

                    {/* Items count */}
                    <div className="text-center md:w-28 shrink-0">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">
                        {t('list.items')}
                      </p>
                      <p className="text-white font-black text-xl">
                        {order.totalItems}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="md:w-44 shrink-0">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">
                        {t('list.date')}
                      </p>
                      <p className="text-slate-300 text-sm">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="md:w-auto shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<MdVisibility size={16} />}
                        onClick={() => router.push(`/dashboard/admin/orders/${order.id}`)}
                      >
                        {t('list.actions.viewDetail')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
