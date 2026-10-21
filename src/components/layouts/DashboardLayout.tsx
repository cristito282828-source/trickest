import Providers from "@/components/Providers";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileGameMenu } from "@/components/sidebar/MobileGameMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-neutral-100 min-h-screen antialiased text-neutral-300">
      <Providers>
        <div
          className="flex flex-col transition-[margin,min-height] duration-200 motion-reduce:transition-none lg:flex-row"
          style={{
            marginTop: 'var(--dashboard-header-offset, 80px)',
            minHeight: 'calc(100vh - var(--dashboard-header-offset, 80px))',
          }}
        >
          {/* Sidebar - solo visible en desktop */}
          <div className="hidden lg:block h-full">
            <Sidebar />
          </div>

          {/* Contenido principal con padding bottom para el menu mobile */}
          <div className="flex-1 w-full overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] text-neutral-900 lg:pb-0">
            {children}
          </div>
        </div>

        {/* Menu flotante estilo videojuego - solo visible en mobile */}
        <MobileGameMenu />
      </Providers>
    </div>
  );
}
