import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Scissors, Settings, X, LogOut, ChevronRight, Image, UserCog, Globe, Bell
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
  { label: 'Dashboard',     path: '/admin',              icon: LayoutDashboard },
  { label: 'Calendario',    path: '/admin/calendario',   icon: Calendar },
  { label: 'Citas',         path: '/admin/citas',        icon: ClipboardList },
  { label: 'Recordatorios', path: '/admin/recordatorios', icon: Bell },
  { label: 'Clientes',      path: '/admin/clientes',     icon: Users },
  { label: 'Servicios',     path: '/admin/servicios',    icon: Scissors },
  { label: 'Equipo',        path: '/admin/equipo',       icon: UserCog },
  { label: 'Galería',       path: '/admin/galeria',      icon: Image },
  { label: 'Configuración', path: '/admin/configuracion',icon: Settings },
];

const AdminSidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-admin-border">
        <Logo />
        <button
          onClick={onMobileClose}
          className="lg:hidden text-admin-muted hover:text-admin-text p-1 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-admin-muted mb-3">
          Menú Principal
        </p>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                  : 'text-admin-muted hover:bg-admin-surface hover:text-admin-text'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User / logout */}
      <div className="px-3 py-4 border-t border-admin-border">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-admin-muted hover:bg-admin-surface hover:text-admin-text transition-all duration-150 mb-3 border border-dashed border-admin-border hover:border-brand-rose/30"
        >
          <Globe className="h-4 w-4 text-brand-rose shrink-0" />
          <span className="flex-1 text-left">Volver al sitio web</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shadow-rose-sm">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-admin-text truncate">{user?.email ?? 'Admin'}</p>
            <p className="text-[10px] text-admin-muted">Administrador</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-admin-muted hover:bg-red-50 hover:text-red-500 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-admin-sidebar h-screen sticky top-0 shrink-0 border-r border-admin-border shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-64 bg-admin-sidebar border-r border-admin-border shadow-xl lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
