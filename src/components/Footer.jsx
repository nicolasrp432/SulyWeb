import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/Logo';

const Footer = () => {
  const { toast } = useToast();

  const handleSocialClick = (e) => {
    e.preventDefault();
    toast({
      title: '🚧 ¡Próximamente!',
      description: 'Nuestras redes sociales estarán activas muy pronto. ¡Síguenos!',
      variant: 'destructive',
    });
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo />
            <p className="mt-2 text-muted-foreground">
              Tu oasis de belleza y cuidado personal. Expertos en realzar tu belleza natural.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Enlaces Rápidos</p>
            <ul className="mt-4 space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-primary">Inicio</Link></li>
              <li><Link to="/servicios" className="text-muted-foreground hover:text-primary">Servicios</Link></li>
              <li><Link to="/galeria" className="text-muted-foreground hover:text-primary">Galería</Link></li>
              <li><Link to="/contacto" className="text-muted-foreground hover:text-primary">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Síguenos</p>
            <div className="flex mt-4 space-x-4">
              <a href="#" onClick={handleSocialClick} className="text-muted-foreground hover:text-primary"><Facebook /></a>
              <a href="#" onClick={handleSocialClick} className="text-muted-foreground hover:text-primary"><Instagram /></a>
              <a href="#" onClick={handleSocialClick} className="text-muted-foreground hover:text-primary"><Youtube /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center space-x-2">
            <span>&copy; {new Date().getFullYear()}</span>
            <Logo />
            <span>Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;