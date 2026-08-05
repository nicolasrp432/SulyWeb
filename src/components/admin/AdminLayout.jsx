import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import InstallPWAHint from './InstallPWAHint';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markOneRead } = useRealtimeNotifications();

  return (
    <div className="flex h-screen bg-admin-bg overflow-hidden">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onMarkOneRead={markOneRead}
        />
        {/* overflow-x-hidden: red de seguridad para que ningún componente pueda
            provocar scroll lateral en móvil. Lo que sí necesita desplazarse en
            horizontal (filtros de servicios/galería, carrusel de manicuristas)
            tiene su propio contenedor con overflow-x-auto. */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <InstallPWAHint />
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
