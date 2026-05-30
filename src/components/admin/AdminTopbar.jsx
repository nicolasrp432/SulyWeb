import React, { useRef, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationsPanel from './NotificationsPanel';

const AdminTopbar = ({
  onMobileMenuOpen,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onMarkOneRead,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef(null);

  return (
    <header className="h-14 bg-admin-sidebar border-b border-admin-border flex items-center gap-3 px-4 shrink-0 shadow-sm">
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <button
        ref={bellRef}
        onClick={() => setPanelOpen((v) => !v)}
        className={`relative p-1.5 rounded-lg transition-colors ${
          panelOpen
            ? 'text-brand-rose bg-admin-surface'
            : 'text-admin-muted hover:text-brand-rose hover:bg-admin-surface'
        }`}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-rose text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <NotificationsPanel
        open={panelOpen}
        anchorRef={bellRef}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setPanelOpen(false)}
        onMarkAllRead={onMarkAllRead}
        onMarkOneRead={onMarkOneRead}
      />
    </header>
  );
};

export default AdminTopbar;
