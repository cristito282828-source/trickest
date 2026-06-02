'use client';

import { useAdminShortcut } from '@/hooks/useAdminShortcut';

export default function AdminShortcutWrapper() {
  useAdminShortcut();
  return null;
}
