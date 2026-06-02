import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function SkatersDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
