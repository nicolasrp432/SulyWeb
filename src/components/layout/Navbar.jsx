import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, Home, Scissors, Image, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const navItems = [
  { name: 'Inicio',    path: '/',          icon: Home },
  { name: 'Servicios', path: '/servicios', icon: Scissors },
  { name: 'Galería',   path: '/galeria',   icon: Image },
  { name: 'Contacto',  path: '/contacto',  icon: Phone },
];

const Navbar = () => {
  const [isOpen, setIsOpen]       = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  return (
    <>
      {/* ── Main nav bar ── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-body bg-white/95 backdrop-blur-md border-b border-brand-rose-100 ${
          isScrolled ? 'shadow-card' : 'shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <Logo />

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-brand-rose bg-brand-rose-50'
                      : 'text-brand-mid hover:text-brand-rose hover:bg-brand-rose-50'
                  }`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <motion.span
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full bg-brand-rose/8 ring-1 ring-brand-rose/20"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <Button
                asChild
                className="bg-gradient-rose-gold text-white px-6 rounded-full shadow-rose-sm hover:shadow-rose-md hover:brightness-105 transition-all duration-200"
              >
                <Link to="/reservas">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservar Cita
                </Link>
              </Button>
            </div>

            {/* Mobile: hamburger */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 rounded-xl text-brand-mid hover:text-brand-rose hover:bg-brand-rose-50 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile: slide-over drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-brand-dark/50 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[82vw] max-w-xs bg-white shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-rose-100">
                <Logo />
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-2 rounded-xl text-brand-mid hover:text-brand-rose hover:bg-brand-rose-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055 + 0.08 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                          isActive(item.path)
                            ? 'text-brand-rose bg-brand-rose-50 ring-1 ring-brand-rose/20'
                            : 'text-brand-mid hover:text-brand-rose hover:bg-brand-rose-50'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.name}
                        {isActive(item.path) && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-brand-rose" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Drawer footer CTA */}
              <div className="px-4 pb-8 pt-4 border-t border-brand-rose-100">
                <Button
                  asChild
                  size="xl"
                  className="w-full bg-gradient-rose-gold text-white rounded-2xl shadow-rose-md"
                >
                  <Link to="/reservas">
                    <Calendar className="h-5 w-5 mr-2" />
                    Reservar Cita
                  </Link>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: floating bottom CTA bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-pb">
        <div className="bg-white/95 backdrop-blur-sm border-t border-brand-rose-100 px-4 py-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-rose-gold text-white rounded-xl shadow-rose-md"
          >
            <Link to="/reservas">
              <Calendar className="h-4 w-4 mr-2" />
              Reservar Cita Online
            </Link>
          </Button>
        </div>
      </div>

      {/* Spacer so content doesn't hide behind floating bottom bar on mobile */}
      <div className="lg:hidden h-[72px]" aria-hidden="true" />
    </>
  );
};

export default Navbar;
