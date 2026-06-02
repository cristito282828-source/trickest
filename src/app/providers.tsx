// app/providers.tsx
'use client';

import AdminShortcutWrapper from '@/components/AdminShortcutWrapper';
import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import { SupabaseRealtimeProvider } from '@/providers/SupabaseRealtimeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextUIProvider>
        <SupabaseRealtimeProvider>
          <AdminShortcutWrapper />
          {children}
        </SupabaseRealtimeProvider>
      </NextUIProvider>
    </SessionProvider>
  );
}
