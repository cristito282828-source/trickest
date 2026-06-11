'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { Button } from '@/components/atoms';
import {
  MdArrowBack,
  MdPerson,
  MdLocationOn,
  MdNotes,
  MdShoppingBag,
  MdOpenInNew,
  MdEmail,
  MdPhone,
  MdAccessTime,
  MdLocalShipping,
  MdImage,
} from 'react-icons/md';
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

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations('adminOrdersPage');
  const router = useRouter();
  const { id } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ship modal state
  const { isOpen: isShipOpen, onOpen: onShipOpen, onClose: onShipClose } = useDisclosure();
  const [shipFile, setShipFile] = useState<File | null>(null);
  const [shipPreview, setShipPreview] = useState<string | null>(null);
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data?.order ?? null);
      } else if (response.status === 404) {
        setError('NOT_FOUND');
      } else if (response.status === 403) {
        setError('FORBIDDEN');
      } else {
        setError('UNKNOWN');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('UNKNOWN');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setShipFile(null);
      setShipPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setShipError(t('ship.errorUpload'));
      return;
    }
    setShipError(null);
    setShipFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setShipPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetShipModal = () => {
    setShipFile(null);
    setShipPreview(null);
    setShipError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShipClose = () => {
    if (shipSubmitting) return;
    resetShipModal();
    onShipClose();
  };

  const handleShipSubmit = async () => {
    if (!shipFile || !shipPreview) {
      setShipError(t('ship.errorUpload'));
      return;
    }

    setShipSubmitting(true);
    setShipError(null);

    try {
      // 1. Subir la foto a Supabase
      const uploadRes = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: shipPreview, // ya es base64 data URL
          filename: `guide-order-${id}.jpg`,
          fileType: 'order-shipping',
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        const msg = uploadData?.error?.message ?? uploadData?.message ?? t('ship.errorUpload');
        setShipError(msg);
        setShipSubmitting(false);
        return;
      }

      const guideUrl: string = uploadData.url ?? uploadData.data?.url;
      if (!guideUrl) {
        setShipError(t('ship.errorUpload'));
        setShipSubmitting(false);
        return;
      }

      // 2. PATCH al endpoint de orders con el nuevo status + url
      const patchRes = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          shippingGuideUrl: guideUrl,
        }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => ({}));
        const msg = patchData?.error?.message ?? t('ship.errorUpdate');
        setShipError(msg);
        setShipSubmitting(false);
        return;
      }

      // 3. Refrescar la orden y cerrar modal
      resetShipModal();
      onShipClose();
      await fetchOrder();
    } catch (err) {
      console.error('Error shipping order:', err);
      setShipError(t('ship.errorUpdate'));
    } finally {
      setShipSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (priceStr: string) => {
    // El precio en DB es "190.000" como string (formato colombiano sin decimals)
    const cleaned = priceStr.replace(/[^\d]/g, '');
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return `$${priceStr}`;
    return `$${num.toLocaleString('es-CO')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-slate-900 border-2 border-slate-700">
            <CardBody className="p-12 text-center">
              <p className="text-red-400 text-lg mb-4">
                {error === 'NOT_FOUND'
                  ? 'Pedido no encontrado'
                  : error === 'FORBIDDEN'
                  ? 'No tienes permiso para ver este pedido'
                  : 'Error al cargar el pedido'}
              </p>
              <Link
                href="/dashboard/admin/orders"
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                ← {t('detail.backToList')}
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const canShip = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/orders"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 font-bold text-sm"
          >
            <MdArrowBack size={18} />
            {t('detail.backToList')}
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
              {t('detail.title')} #{order.id}
            </h1>
            <span
              className={`text-sm bg-gradient-to-r ${STATUS_GRADIENTS[order.status]} text-white px-4 py-1.5 rounded-full font-black uppercase tracking-wider shadow-lg`}
            >
              {t(`filters.status_${order.status}`)}
            </span>
            {canShip && (
              <Button
                variant="purple"
                size="sm"
                leftIcon={<MdLocalShipping size={18} />}
                onClick={onShipOpen}
              >
                {t('ship.button')}
              </Button>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
            <MdAccessTime size={16} />
            {t('detail.createdAt')}: {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Customer info */}
          <Card className="bg-slate-900 border-2 border-slate-700 lg:col-span-1">
            <CardHeader className="border-b border-slate-700 p-4">
              <div className="flex items-center gap-2">
                <MdPerson className="text-cyan-400" size={20} />
                <p className="text-white font-black uppercase tracking-wider text-sm">
                  {t('detail.customerInfo')}
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <div>
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                  Nombre
                </p>
                <p className="text-white font-bold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <MdEmail size={12} />
                  Email
                </p>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
                >
                  {order.customerEmail}
                </a>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <MdPhone size={12} />
                  Teléfono
                </p>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  {order.customerPhone}
                </a>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                  {order.userId ? t('detail.skaterAccount') : t('detail.guestAccount')}
                </p>
                {order.userId && (
                  <p className="text-slate-300 text-sm break-all">{order.userId}</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Shipping */}
          <Card className="bg-slate-900 border-2 border-slate-700 lg:col-span-2">
            <CardHeader className="border-b border-slate-700 p-4">
              <div className="flex items-center gap-2">
                <MdLocationOn className="text-accent-purple-400" size={20} />
                <p className="text-white font-black uppercase tracking-wider text-sm">
                  {t('detail.shippingAddress')}
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <div>
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                  {t('detail.shippingAddress')}
                </p>
                <p className="text-white">{order.shippingAddress}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">
                  {t('detail.shippingCity')}
                </p>
                <p className="text-white">{order.shippingCity}</p>
              </div>
              {order.shippingNotes && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <MdNotes size={12} />
                    {t('detail.shippingNotes')}
                  </p>
                  <p className="text-slate-300 text-sm italic">
                    &ldquo;{order.shippingNotes}&rdquo;
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Shipping guide (only when shipped) */}
          {order.shippingGuideUrl && (
            <Card className="bg-slate-900 border-2 border-accent-purple-500/50 lg:col-span-3">
              <CardHeader className="border-b border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <MdLocalShipping className="text-accent-purple-400" size={20} />
                  <p className="text-white font-black uppercase tracking-wider text-sm">
                    {t('detail.shippingGuide')}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="relative w-full md:w-64 h-64 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shrink-0">
                    <Image
                      src={order.shippingGuideUrl}
                      alt="Shipping guide"
                      fill
                      sizes="(max-width: 768px) 100vw, 256px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <a
                      href={order.shippingGuideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold text-sm"
                    >
                      <MdOpenInNew size={16} />
                      {t('detail.openGuide')}
                    </a>
                    <p className="text-slate-500 text-xs break-all">{order.shippingGuideUrl}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Products */}
          <Card className="bg-slate-900 border-2 border-slate-700 lg:col-span-3">
            <CardHeader className="border-b border-slate-700 p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MdShoppingBag className="text-accent-pink-400" size={20} />
                  <p className="text-white font-black uppercase tracking-wider text-sm">
                    {t('detail.products')}
                  </p>
                </div>
                <p className="text-cyan-400 font-black">
                  {order.totalItems} {t('detail.totalItems')}
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {order.items.length === 0 ? (
                <p className="text-slate-500 text-center py-6">
                  {t('detail.notProvided')}
                </p>
              ) : (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 shrink-0 bg-slate-900 rounded overflow-hidden">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">
                        {item.productName}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {t('detail.unitPrice')}: {formatPrice(item.productPrice)}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="text-center shrink-0">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">
                        {t('detail.quantity')}
                      </p>
                      <p className="text-white font-black text-lg">
                        ×{item.quantity}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0 md:w-28">
                      <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">
                        {t('detail.subtotal')}
                      </p>
                      <p className="text-cyan-400 font-black">
                        {formatPrice(
                          (parseInt(item.productPrice.replace(/[^\d]/g, ''), 10) * item.quantity).toString()
                        )}
                      </p>
                    </div>

                    {/* External link */}
                    <a
                      href={`https://toryskateshop.com/?product=${item.productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 shrink-0"
                      title={t('detail.openProduct')}
                    >
                      <MdOpenInNew size={20} />
                    </a>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Ship modal */}
      <Modal
        isOpen={isShipOpen}
        onClose={handleShipClose}
        size="md"
        scrollBehavior="inside"
        classNames={{
          base: 'bg-neutral-900 border-2 border-accent-purple-500/50',
          header: 'border-b border-slate-700',
          footer: 'border-t border-slate-700',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <MdLocalShipping className="text-accent-purple-400" size={20} />
                <span className="text-white font-black uppercase tracking-wider text-sm">
                  {t('ship.modalTitle')}
                </span>
              </ModalHeader>
              <ModalBody className="py-5">
                <p className="text-slate-400 text-sm mb-3">
                  {t('ship.imageHelp')}
                </p>

                {/* File input (hidden) + button trigger */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-accent-purple-400 rounded-lg p-4 transition-all"
                >
                  <MdImage size={20} className="text-slate-400" />
                  <span className="text-slate-300 font-bold text-sm">
                    {shipFile ? shipFile.name : t('ship.selectImage')}
                  </span>
                </button>

                {/* Preview */}
                {shipPreview && (
                  <div className="mt-4">
                    <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-2">
                      {t('ship.preview')}
                    </p>
                    <div className="relative w-full h-64 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700">
                      <Image
                        src={shipPreview}
                        alt="Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                )}

                {shipError && (
                  <p className="mt-3 text-red-400 text-sm font-bold">{shipError}</p>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleShipClose}
                  disabled={shipSubmitting}
                >
                  {t('ship.cancel')}
                </Button>
                <Button
                  variant="purple"
                  size="md"
                  onClick={handleShipSubmit}
                  isLoading={shipSubmitting}
                  disabled={!shipFile || shipSubmitting}
                  leftIcon={!shipSubmitting ? <MdLocalShipping size={18} /> : undefined}
                >
                  {shipSubmitting ? t('ship.submitting') : t('ship.submit')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
