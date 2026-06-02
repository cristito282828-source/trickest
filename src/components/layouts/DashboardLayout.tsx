import Providers from "@/components/Providers";
import { Sidebar } from "@/components/sidebar/Sidebar";
import Appbar from "@/components/Appbar";
import { MobileGameMenu } from "@/components/sidebar/MobileGameMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-neutral-100 min-h-screen antialiased text-neutral-300">
      <Providers>
        {/* Navbar sticky en la parte superior */}
        <Appbar />

        <div className="flex flex-col lg:flex-row" style={{ marginTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
          {/* Sidebar - solo visible en desktop */}
          <div className="hidden lg:block h-full">
            <Sidebar />
          </div>

          {/* Contenido principal con padding bottom para el menu mobile */}
          <div className="flex-1 w-full text-neutral-900 overflow-y-auto pb-20 lg:pb-0">
            {children}
          </div>
        </div>

        {/* Menu flotante estilo videojuego - solo visible en mobile */}
        <MobileGameMenu />
      </Providers>
    </div>
  );
}
