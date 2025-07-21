import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/Logo';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/galeria', label: 'Galería' },
  { href: '/contacto', label: 'Contacto' },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleUnimplementedClick = (e, feature) => {
    if (['/servicios', '/galeria', '/contacto'].includes(feature)) {
      e.preventDefault();
      toast({
        title: '🚧 ¡En construcción!',
        description: 'Esta sección estará disponible muy pronto. ¡Gracias por tu paciencia! 🚀',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo />

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => handleUnimplementedClick(e, link.href)}
                className="text-foreground hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button asChild>
              <Link to="/reservas" onClick={(e) => handleUnimplementedClick(e, '/reservas')}>Reservar Cita</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-foreground">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-secondary"
          >
            <nav className="flex flex-col items-center space-y-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => {
                    handleUnimplementedClick(e, link.href);
                    toggleMenu();
                  }}
                  className="text-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild>
                <Link to="/reservas" onClick={(e) => {
                  handleUnimplementedClick(e, '/reservas');
                  toggleMenu();
                }}>Reservar Cita</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;