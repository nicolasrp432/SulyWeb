import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminTopbar = ({ onMobileMenuOpen, notificationCount = 0 }) => (
  <header className="h-14 bg-admin-sidebar border-b border-admin-border flex items-center gap-3 px-4 shrink-0 shadow-sm">
    <button
      onClick={onMobileMenuOpen}
      className="lg:hidden p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
      aria-label="Abrir menú"
    >
      <Menu className="h-5 w-5" />
    </button>
    <div className="flex-1" />
    <button className="relative p-1.5 rounded-lg text-admin-muted hover:text-brand-rose hover:bg-admin-surface transition-colors">
      <Bell className="h-5 w-5" />
      {notificationCount > 0 && (
        <motion.span
          key={notificationCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-rose text-white text-[10px] font-bold flex items-center justify-center"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </motion.span>
      )}
    </button>
  </header>
);

export default AdminTopbar;
