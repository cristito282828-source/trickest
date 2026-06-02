import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
