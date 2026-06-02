export const dynamic = 'force-dynamic';

import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function JudgesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
