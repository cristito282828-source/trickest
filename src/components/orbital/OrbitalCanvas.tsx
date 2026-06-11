'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { OrbitalEngine, OrbitalState, type OrbitalProduct } from './orbital-engine';
import { preloadAll, getCachedImage } from './product-images';
import { useCart } from '@/components/providers/CartProvider';
import { MdClose, MdOpenInNew, MdCheck, MdShoppingCart, MdCheckCircle } from 'react-icons/md';

interface OrbitalCanvasProps {
  products: OrbitalProduct[];
}

const CANVAS_BG = '#0a0a0f'; // Casi negro con tinte morado muy sutil

export default function OrbitalCanvas({ products }: OrbitalCanvasProps) {
  const t = useTranslations('supplsPage');
  const { addItem, isInCart, getQuantity } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OrbitalEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [anchored, setAnchored] = useState<OrbitalState | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Pre-cargar imágenes al montar (o cuando cambien los productos)
  useEffect(() => {
    let cancelled = false;

    const urls = products
      .map((p) => p.imageUrl)
      .filter((u): u is string => Boolean(u));

    if (urls.length === 0) {
      setImagesReady(true);
      return;
    }

    setImagesReady(false);
    preloadAll(urls).then(() => {
      if (!cancelled) setImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [products]);

  // Callback para obtener coords del mouse relativas al canvas
  const getCanvasCoords = useCallback((e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Inicializar engine + canvas cuando el componente se monta
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Esperar a que el contenedor tenga dimensiones
    const initCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      // Configurar el canvas con DPR para sharp en retina
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      // Crear engine con los productos
      const engine = new OrbitalEngine({
        width,
        height,
        products,
        radius: 40,
      });
      engineRef.current = engine;

      // Iniciar loop
      const animate = (timestamp: number) => {
        if (!engineRef.current) return;

        const deltaTime = lastTimeRef.current
          ? (timestamp - lastTimeRef.current) / 1000
          : 0;
        lastTimeRef.current = timestamp;

        // Cap deltaTime para evitar saltos grandes (ej: tab inactivo)
        const safeDelta = Math.min(deltaTime, 0.05);

        // Update física
        engineRef.current.update(safeDelta);

        // Render
        render(ctx, engineRef.current, width, height);

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    initCanvas();

    // Resize observer para el canvas
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      engineRef.current?.resize(rect.width, rect.height);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      engineRef.current = null;
    };
  }, [products]);

  // Render del canvas con imágenes reales (Fase 2)
  const render = (
    ctx: CanvasRenderingContext2D,
    engine: OrbitalEngine,
    width: number,
    height: number,
  ) => {
    // Limpiar
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, width, height);

    // Grid sutil retro
    ctx.strokeStyle = 'rgba(52, 239, 194, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render productos
    const allProducts = engine.getProducts();
    for (const p of allProducts) {
      const isAnchored = p.anchored;
      const isHovered = p.hovered;
      const baseRadius = p.radius;
      const radius = isAnchored
        ? baseRadius * 1.3
        : isHovered
          ? baseRadius * 1.1
          : baseRadius;

      // Glow si está hovered o anclado
      if (isHovered || isAnchored) {
        ctx.shadowColor = isAnchored ? '#ff3eb5' : '#34efc2';
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowBlur = 0;
      }

      // Intentar cargar la imagen cacheada
      const img = p.product.imageUrl ? getCachedImage(p.product.imageUrl) : null;

      if (img) {
        // Render con imagen: clip circular + drawImage
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Cubrir el círculo con la imagen
        // object-fit: cover simulado: tomar el lado mayor y centrar
        const size = radius * 2;
        const aspect = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (aspect > 1) {
          // Imagen más ancha que alta: crop horizontal
          sw = img.naturalHeight;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          // Imagen más alta que ancha: crop vertical
          sh = img.naturalWidth;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, p.x - radius, p.y - radius, size, size);
        ctx.restore();
      } else {
        // Fallback: gradiente cyan→purple + inicial
        const gradient = ctx.createLinearGradient(
          p.x - radius,
          p.y - radius,
          p.x + radius,
          p.y + radius,
        );
        if (isAnchored) {
          gradient.addColorStop(0, '#ff3eb5');
          gradient.addColorStop(1, '#a855f7');
        } else {
          gradient.addColorStop(0, '#34efc2');
          gradient.addColorStop(1, '#a855f7');
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Borde
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isAnchored
        ? '#ffffff'
        : isHovered
          ? '#34efc2'
          : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isAnchored || isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Si no hay imagen cargada, mostrar inicial
      if (!img) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${radius * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.product.name.charAt(0).toUpperCase(), p.x, p.y);
      }

      // Si está anclado, mostrar el nombre completo debajo
      if (isAnchored) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.product.name, p.x, p.y + radius + 20);
        ctx.shadowBlur = 0;
      }
    }

    // Hint cuando no hay nada anclado
    if (!engine.getAnchored()) {
      ctx.fillStyle = 'rgba(52, 239, 194, 0.6)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('clickHint'), width / 2, 30);
    }
  };

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    engineRef.current?.handleHover(x, y);
  };

  const handleMouseLeave = () => {
    engineRef.current?.handleHover(-9999, -9999);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const result = engineRef.current?.handleClick(x, y) ?? null;
    setAnchored(result);
  };

  // Tecla ESC para liberar el anclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && anchored) {
        engineRef.current?.releaseAnchored();
        setAnchored(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anchored]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[600px]">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-accent-cyan-500/30"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="block cursor-pointer"
        />

        {/* Loading overlay mientras se cargan las imágenes */}
        {!imagesReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-accent-cyan-400 font-bold uppercase tracking-wider text-sm">
                {t('loadingProducts')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel de detalle cuando hay un producto anclado */}
      {anchored && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 z-10 bg-neutral-900/95 backdrop-blur-md border-2 border-accent-pink-500 rounded-2xl p-6 w-[90vw] max-w-md shadow-2xl">
          <button
            type="button"
            onClick={() => {
              engineRef.current?.releaseAnchored();
              setAnchored(null);
            }}
            aria-label={t('closePanel')}
            className="absolute top-3 right-3 text-neutral-400 hover:text-white text-2xl font-bold"
          >
            <MdClose />
          </button>

          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-2 pr-8">
            {anchored.product.name}
          </h3>

          {anchored.product.price && (
            <p className="text-accent-yellow-400 font-black text-2xl mb-4">
              {anchored.product.price}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              addItem(
                {
                  productId: anchored.product.id,
                  productName: anchored.product.name,
                  productPrice: anchored.product.price ?? '',
                  productImage: anchored.product.imageUrl,
                  productSlug: anchored.product.slug,
                },
                1
              );
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 2000);
            }}
            disabled={justAdded}
            className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg border-2 uppercase tracking-wider text-sm shadow-lg transform transition-all font-black ${
              justAdded || isInCart(anchored.product.id)
                ? 'bg-accent-cyan-500 text-neutral-900 border-white'
                : 'bg-accent-pink-500 hover:bg-accent-pink-600 text-white border-white hover:scale-105'
            }`}
          >
            {justAdded || isInCart(anchored.product.id) ? (
              <>
                <MdCheckCircle />
                {t('addedToCart')}
                {getQuantity(anchored.product.id) > 0 &&
                  ` (${getQuantity(anchored.product.id)})`}
              </>
            ) : (
              <>
                <MdShoppingCart />
                {t('addToCart')}
              </>
            )}
          </button>

          <a
            href={`https://toryskateshop.com/?product=${anchored.product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2 px-6 rounded-lg border border-neutral-700 uppercase tracking-wider text-xs transition-all"
          >
            <MdOpenInNew />
            {t('viewOnStore')}
          </a>

          <p className="text-neutral-500 text-xs mt-3 text-center flex items-center justify-center gap-1">
            <MdCheck className="text-accent-cyan-400" />
            {t('escapeHint')}
          </p>
        </div>
      )}
    </div>
  );
}
