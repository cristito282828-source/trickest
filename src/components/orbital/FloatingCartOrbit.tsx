'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing';
import { useCart } from '@/components/providers/CartProvider';
import { OrbitalEngine, OrbitalProduct } from './orbital-engine';

const MOCK_PRODUCT: OrbitalProduct = {
  id: 'cart-orbit',
  name: 'Carrito de compras',
  slug: 'cart',
  price: null,
  imageUrl: null,
};

const BALL_RADIUS = 36; // bolita de 72x72 px
const BALL_SIZE = BALL_RADIUS * 2;

export default function FloatingCartOrbit() {
  const router = useRouter();
  const { itemCount } = useCart();
  const engineRef = useRef<OrbitalEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Resize observer para el viewport
  useEffect(() => {
    const updateSize = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Inicializar engine + animation loop
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;

    const engine = new OrbitalEngine({
      width: size.w,
      height: size.h,
      products: [MOCK_PRODUCT],
      radius: BALL_RADIUS,
      minSpeed: 120,
      maxSpeed: 220,
      separationPadding: 1, // irrelevante con 1 producto
    });
    engineRef.current = engine;

    // Forzar posición inicial visible (esquina superior izquierda, lejos del header)
    const initial = engine.getProducts()[0];
    setPos({ x: initial.x - BALL_RADIUS, y: initial.y - BALL_RADIUS });

    const loop = (now: number) => {
      const last = lastTimeRef.current || now;
      const dt = Math.min((now - last) / 1000, 0.05); // cap a 50ms
      lastTimeRef.current = now;
      engine.update(dt);
      const p = engine.getProducts()[0];
      setPos({ x: p.x - BALL_RADIUS, y: p.y - BALL_RADIUS });
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [size.w, size.h]);

  const handleClick = () => {
    router.push('/suppls');
  };

  if (size.w === 0) return null; // No renderizar hasta tener dimensiones

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Ir a la tienda"
      className={`fixed z-[9990] cursor-pointer select-none ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
      }`}
      style={{
        left: 0,
        top: 0,
        width: `${BALL_SIZE}px`,
        height: `${BALL_SIZE}px`,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: mounted
          ? 'opacity 700ms ease-out, transform 0ms'
          : 'opacity 0ms, transform 0ms',
      }}
    >
      {/* Glow halo (suave, sin fondo de color) */}
      <div className="absolute inset-0 rounded-full bg-yellow-300/20 blur-xl animate-pulse pointer-events-none" />

      {/* Main: solo la imagen PNG con su drop-shadow */}
      <div className="relative w-full h-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
        <Image
          src="/snich.png"
          alt="Golden snitch"
          width={72}
          height={72}
          className="w-[72px] h-[72px] object-contain wing-flap pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* Item count badge (solo si hay items) */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent-cyan-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg pointer-events-none">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/* Animación de aleteo de la snitch */}
      <style>{`
        @keyframes wing-flap {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.8) rotate(0deg); }
        }
        .wing-flap { animation: wing-flap 0.35s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
