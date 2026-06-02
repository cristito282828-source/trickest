'use client';

import { useEffect, useState, PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';

const ModalPortal = ({ children }: PropsWithChildren) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <>{children}</>,
    document.body
  );
};

export default ModalPortal;
