'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdminShortcut() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl + Shift + A para acceder al admin
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (session?.user?.role === 'admin') {
          router.push('/admin');
        } else {
          console.log('No tienes permisos de administrador');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router, session]);
}
