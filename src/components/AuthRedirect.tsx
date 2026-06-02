'use client';

import { useEffect } from 'react';

interface AuthRedirectProps {
  authRequired: boolean;
}

/**
 * Componente que detecta redirección de autenticación y abre el menú automáticamente
 */
const AuthRedirect = ({ authRequired }: AuthRedirectProps) => {
  useEffect(() => {
    if (authRequired) {
      // Disparar evento para abrir el menú principal automáticamente
      window.dispatchEvent(new CustomEvent('arcade-press-start'));

      // Limpiar el parámetro de la URL sin recargar la página
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, [authRequired]);

  return null; // No renderiza nada
};

export default AuthRedirect;
