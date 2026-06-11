'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCart } from '@/components/providers/CartProvider';
import CheckoutDrawer from './CheckoutDrawer';
import { MdShoppingCart, MdClose, MdAdd, MdRemove, MdDelete } from 'react-icons/md';

export default function FloatingCart() {
  const t = useTranslations('supplsPage');
  const { items, itemCount, hasItems, removeItem, updateQuantity, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!hasItems && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t('viewCart')}
        className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2 bg-accent-pink-500 hover:bg-accent-pink-600 text-white rounded-full px-4 py-3 shadow-2xl shadow-accent-pink-500/40 transition-all hover:scale-105 border-2 border-white"
      >
        <MdShoppingCart className="text-xl" />
        {itemCount > 0 && (
          <span className="bg-white text-accent-pink-600 font-black text-sm rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Drawer del carrito */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9991] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 bottom-0 z-[9992] w-full max-w-md bg-neutral-900 border-l-2 border-accent-pink-500 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <MdShoppingCart />
                {t('cartTitle')}
                {itemCount > 0 && (
                  <span className="text-sm text-neutral-400">({itemCount})</span>
                )}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t('closePanel')}
                className="text-neutral-400 hover:text-white text-2xl"
              >
                <MdClose />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center text-neutral-500 mt-12">
                  <MdShoppingCart className="text-6xl mx-auto mb-3 opacity-30" />
                  <p>{t('cartEmpty')}</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center gap-3 bg-neutral-800/50 border border-neutral-700 rounded-lg p-3"
                    >
                      {/* Imagen */}
                      <div className="relative w-16 h-16 flex-shrink-0 bg-neutral-900 rounded overflow-hidden">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                            🛹
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {item.productName}
                        </p>
                        <p className="text-accent-yellow-400 text-sm font-bold">
                          {item.productPrice}
                        </p>

                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 bg-neutral-700 hover:bg-neutral-600 rounded text-white flex items-center justify-center"
                          >
                            <MdRemove className="text-xs" />
                          </button>
                          <span className="text-white font-bold text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 bg-neutral-700 hover:bg-neutral-600 rounded text-white flex items-center justify-center"
                          >
                            <MdAdd className="text-xs" />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            aria-label="Remove"
                            className="ml-auto w-6 h-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded flex items-center justify-center"
                          >
                            <MdDelete className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-neutral-800 space-y-2">
                <button
                  onClick={clearCart}
                  className="w-full text-neutral-400 hover:text-red-400 text-sm font-bold uppercase tracking-wider py-2 transition-colors"
                >
                  {t('clearCart')}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full bg-accent-cyan-500 hover:bg-accent-cyan-600 text-neutral-900 font-black py-3 px-4 rounded-lg uppercase tracking-wider text-sm border-2 border-white shadow-lg transform hover:scale-105 transition-all"
                >
                  {t('checkoutButton')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkout drawer (se monta fuera del isOpen del cart) */}
      <CheckoutDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
