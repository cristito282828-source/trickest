'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useCart } from '@/components/providers/CartProvider';
import { MdClose, MdSend, MdCheckCircle, MdError, MdPerson, MdLogin } from 'react-icons/md';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
  const t = useTranslations('supplsPage');
  const { data: session, status: sessionStatus } = useSession();
  const { items, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: number } | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-llenar desde el perfil del skater cuando se abre el drawer
  // (solo si está logueado y aún no se prellenó)
  useEffect(() => {
    if (!isOpen || prefilled || sessionStatus !== 'authenticated') return;

    async function prefillFromProfile() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          const profile = data.user || data;
          setCustomerName(profile.name ?? '');
          setCustomerEmail(profile.email ?? session?.user?.email ?? '');
          setShippingAddress(profile.address ?? '');
          setShippingCity(profile.ciudad ?? profile.city ?? '');
          setPrefilled(true);
        } else {
          // Fallback: usar email de la sesión
          if (session?.user?.email) {
            setCustomerEmail(session.user.email);
          }
          setPrefilled(true);
        }
      } catch (err) {
        console.error('[CheckoutDrawer] Prefill error:', err);
        if (session?.user?.email) {
          setCustomerEmail(session.user.email);
        }
        setPrefilled(true);
      }
    }

    prefillFromProfile();
  }, [isOpen, prefilled, sessionStatus, session?.user?.email]);

  // Reset form cuando se cierra el drawer
  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setShippingCity('');
    setShippingNotes('');
    setErrors({});
    setSuccess(null);
  };

  const handleClose = () => {
    if (submitting) return; // No cerrar durante submit
    resetForm();
    onClose();
  };

  // Validación client-side
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (customerName.trim().length < 2) {
      newErrors.customerName = t('errorNameRequired') || 'Name is required';
    }
    if (!EMAIL_REGEX.test(customerEmail)) {
      newErrors.customerEmail = t('errorEmailInvalid') || 'Invalid email';
    }
    if (customerPhone.trim().length < 7) {
      newErrors.customerPhone = t('errorPhoneRequired') || 'Phone is required';
    }
    if (shippingAddress.trim().length < 5) {
      newErrors.shippingAddress = t('errorAddressRequired') || 'Address is required';
    }
    if (shippingCity.trim().length < 2) {
      newErrors.shippingCity = t('errorCityRequired') || 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: customerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingCity: shippingCity.trim(),
          shippingNotes: shippingNotes.trim() || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            productImage: item.productImage,
            productSlug: item.productSlug,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Intentar extraer mensaje de error del backend
        const errorMsg =
          data?.error?.message ||
          data?.message ||
          'Error al enviar el pedido';
        setErrors({ general: errorMsg });
        return;
      }

      // Éxito
      setSuccess({ orderId: data.data.orderId });
      clearCart();
    } catch (error) {
      console.error('[CheckoutDrawer] Submit error:', error);
      setErrors({
        general: 'Error de red. Por favor intenta de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[9993] bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-[9994] w-full max-w-lg bg-neutral-900 border-l-2 border-accent-cyan-500 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            {t('checkoutTitle')}
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            aria-label={t('closePanel')}
            className="text-neutral-400 hover:text-white text-2xl disabled:opacity-30"
          >
            <MdClose />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <MdCheckCircle className="text-accent-cyan-400 text-7xl mb-4" />
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              {t('orderSuccessTitle')}
            </h3>
            <p className="text-neutral-300 mb-2">{t('orderSuccessMessage')}</p>
            <p className="text-neutral-500 text-sm mb-6">
              {t('orderNumber')}: <span className="font-bold text-accent-cyan-400">#{success.orderId}</span>
            </p>
            <button
              onClick={handleClose}
              className="bg-accent-cyan-500 hover:bg-accent-cyan-600 text-neutral-900 font-black py-3 px-8 rounded-lg uppercase tracking-wider text-sm border-2 border-white shadow-lg transform hover:scale-105 transition-all"
            >
              {t('closePanel')}
            </button>
          </div>
        ) : sessionStatus === 'unauthenticated' ? (
          // Estado: usuario no logueado
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <MdLogin className="text-accent-cyan-400 text-7xl mb-4" />
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              {t('loginRequiredTitle') || 'Inicia sesión'}
            </h3>
            <p className="text-neutral-300 mb-6 max-w-sm">
              {t('loginRequiredMessage') ||
                'Debes iniciar sesión para hacer un pedido.'}
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                // Disparar el evento que escucha el SigninButton
                window.dispatchEvent(new CustomEvent('arcade-press-start'));
              }}
              className="flex items-center justify-center gap-2 bg-accent-cyan-500 hover:bg-accent-cyan-600 text-neutral-900 font-black py-3 px-8 rounded-lg border-2 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all"
            >
              <MdLogin />
              {t('loginButton') || 'Iniciar sesión'}
            </button>
            <p className="text-neutral-500 text-xs mt-4">
              {t('loginHint') || 'Después de iniciar sesión, vuelve aquí para continuar.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Resumen del carrito (compacto) */}
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-800/30">
              <p className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1">
                {t('cartSummary')} ({items.length})
              </p>
              <ul className="space-y-0.5 max-h-20 overflow-y-auto text-sm text-neutral-300">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-2 truncate"
                  >
                    <span className="truncate flex-1 text-xs">{item.productName}</span>
                    <span className="text-accent-yellow-400 font-bold text-xs">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form (compacto, 4 campos clave) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {/* Error general */}
              {errors.general && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-2 flex items-start gap-2">
                  <MdError className="text-red-400 flex-shrink-0 mt-0.5 text-sm" />
                  <p className="text-red-300 text-xs">{errors.general}</p>
                </div>
              )}

              {/* Email (display only, no editable - viene del perfil) */}
              {customerEmail && (
                <p className="text-xs text-neutral-500 italic">
                  📧 {t('fieldEmail')}: <span className="text-neutral-400">{customerEmail}</span>
                </p>
              )}

              {/* Nombre + Teléfono (2 columnas en desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Nombre */}
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1"
                  >
                    👤 {t('fieldName')} *
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={submitting}
                    className={`w-full bg-neutral-800 border-2 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-cyan-500 transition-colors ${
                      errors.customerName ? 'border-red-500' : 'border-neutral-700'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.customerName && (
                    <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="customerPhone"
                    className="block text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1"
                  >
                    📱 {t('fieldPhone')} *
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={submitting}
                    className={`w-full bg-neutral-800 border-2 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-cyan-500 transition-colors ${
                      errors.customerPhone ? 'border-red-500' : 'border-neutral-700'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-400 text-xs mt-1">{errors.customerPhone}</p>
                  )}
                </div>
              </div>

              {/* Dirección (texto libre, full width) */}
              <div>
                <label
                  htmlFor="shippingAddress"
                  className="block text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1"
                >
                  🏠 {t('fieldAddress')} *
                </label>
                <textarea
                  id="shippingAddress"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  className={`w-full bg-neutral-800 border-2 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-cyan-500 transition-colors resize-none ${
                    errors.shippingAddress ? 'border-red-500' : 'border-neutral-700'
                  }`}
                  placeholder="Calle 123 #45-67, Apto 501"
                />
                {errors.shippingAddress && (
                  <p className="text-red-400 text-xs mt-1">{errors.shippingAddress}</p>
                )}
              </div>

              {/* Ciudad */}
              <div>
                <label
                  htmlFor="shippingCity"
                  className="block text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1"
                >
                  🏙️ {t('fieldCity')} *
                </label>
                <input
                  id="shippingCity"
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  disabled={submitting}
                  className={`w-full bg-neutral-800 border-2 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-cyan-500 transition-colors ${
                    errors.shippingCity ? 'border-red-500' : 'border-neutral-700'
                  }`}
                  placeholder="Cali"
                />
                {errors.shippingCity && (
                  <p className="text-red-400 text-xs mt-1">{errors.shippingCity}</p>
                )}
              </div>

              {/* Notas (opcional, colapsable) */}
              <details className="text-xs">
                <summary className="text-neutral-400 cursor-pointer hover:text-white font-bold uppercase tracking-wider mb-1">
                  ➕ {t('fieldNotes')} ({t('optional')})
                </summary>
                <textarea
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  className="w-full mt-1 bg-neutral-800 border-2 border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-cyan-500 transition-colors resize-none"
                  placeholder="Color preferido, hora de entrega, etc."
                />
              </details>
            </div>

            {/* Footer STICKY con submit (siempre visible) */}
            <div className="sticky bottom-0 p-3 border-t-2 border-accent-cyan-500 bg-neutral-900 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="flex items-center justify-center gap-2 w-full bg-accent-cyan-500 hover:bg-accent-cyan-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-neutral-900 disabled:text-neutral-500 font-black py-3 px-4 rounded-lg uppercase tracking-wider text-sm border-2 border-white shadow-lg transform hover:scale-105 disabled:transform-none transition-all"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <MdSend />
                    {t('submitOrder')}
                  </>
                )}
              </button>
              <p className="text-neutral-500 text-xs text-center mt-1.5">
                {t('checkoutDisclaimer')}
              </p>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
