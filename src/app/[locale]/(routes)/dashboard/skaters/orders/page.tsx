'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardBody } from '@nextui-org/react';
import { MdShoppingCart, MdStorefront, MdLocalShipping, MdOpenInNew } from 'react-icons/md';
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

const STATUS_GRADIENTS: Record<Order['status'], string> = {
  pending: 'from-accent-yellow-500 to-accent-orange-500',
  confirmed: 'from-accent-cyan-500 to-accent-blue-500',
  shipped: 'from-accent-purple-500 to-accent-pink-500',
  delivered: 'from-green-500 to-accent-teal-500',
  cancelled: 'from-red-500 to-accent-pink-500',
};

export default function SkaterOrdersPage() {
  const t = useTranslations('skaterOrdersPage');
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [authStatus, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (authStatus !== 'authenticated') return;
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data.data?.orders ?? []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [authStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MdShoppingCart className="text-cyan-400" size={32} />
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider">
              {t('title')}
            </h1>
          </div>
          <p className="text-cyan-300 text-sm md:text-base">{t('subtitle')}</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-slate-900 border-2 border-slate-700">
            <CardBody className="p-12 text-center">
              <MdShoppingCart className="text-slate-600 mx-auto mb-3" size={64} />
              <p className="text-slate-500 text-lg mb-6">{t('empty')}</p>
              <div className="inline-block">
                <Link href="/">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<MdStorefront size={18} />}
                  >
                    {t('browseStore')}
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="bg-slate-900 border-2 border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <CardBody className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    {/* ID + status */}
                    <div className="flex items-center gap-3 md:w-56 shrink-0">
                      <span className="text-cyan-400 font-black text-lg">
                        #{order.id}
                      </span>
                      <span
                        className={`text-xs bg-gradient-to-r ${STATUS_GRADIENTS[order.status]} text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg`}
                      >
                        {t(`status.${order.status}`)}
                      </span>
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
                    <div className="md:flex-1">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">
                        {t('list.date')}
                      </p>
                      <p className="text-slate-300 text-sm">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Items preview */}
                    <div className="md:w-64 shrink-0">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                        {t('list.status')}
                      </p>
                      <p className="text-slate-400 text-sm truncate">
                        {order.items
                          .slice(0, 2)
                          .map((i) => i.productName)
                          .join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                    </div>
                  </div>

                  {/* Shipping guide (visible only when uploaded) */}
                  {order.shippingGuideUrl && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <MdLocalShipping className="text-accent-purple-400" size={16} />
                        <p className="text-white font-black uppercase tracking-wider text-xs">
                          {t('guide.title')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={order.shippingGuideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative shrink-0 w-20 h-20 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-accent-purple-400 transition-colors group"
                          title={t('guide.help')}
                        >
                          <Image
                            src={order.shippingGuideUrl}
                            alt="Shipping guide"
                            fill
                            sizes="80px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        </a>
                        <div className="flex-1 min-w-0">
                          <a
                            href={order.shippingGuideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold text-sm"
                          >
                            {t('guide.viewGuide')}
                            <MdOpenInNew size={14} />
                          </a>
                          <p className="text-slate-500 text-xs mt-1">
                            {t('guide.help')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
