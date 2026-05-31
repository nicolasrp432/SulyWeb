import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Clock,
  Instagram, Facebook, Heart, ChevronDown, Calendar, Settings
} from 'lucide-react';
import Logo from '@/components/Logo';

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/suly_prettynails/', label: 'Instagram' },
  { icon: Facebook,  href: '#',                                             label: 'Facebook' },
];

const quickLinks = [
  { name: 'Servicios', path: '/servicios' },
  { name: 'Galería',   path: '/galeria' },
  { name: 'Reservas',  path: '/reservas' },
  { name: 'Contacto',  path: '/contacto' },
  { name: 'Panel Admin', path: '/admin/login', icon: Settings },
];

const locations = [
  {
    name: 'Sede Basauri',
    address: 'Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia',
    mapsUrl: 'https://maps.google.com/?q=Kareaga+Goikoa+Kalea+28+Basauri',
  },
  {
    name: 'Sede Galdakao',
    address: 'Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia',
    mapsUrl: 'https://maps.google.com/?q=Juan+Bautista+Uriarte+Kalea+27+Galdakao',
  },
];

/* Accordion for mobile footer sections */
const FooterAccordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-none">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 md:py-0 text-left"
      >
        <span className="text-sm font-bold uppercase tracking-widest text-brand-rose-200">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-brand-rose-200 md:hidden transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {(open || true) && (
          <motion.div
            key="content"
            initial={false}
            animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden md:!h-auto md:!opacity-100 md:overflow-visible"
          >
            <div className="pb-4 md:pb-0 md:mt-5 md:block">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-brand-dark via-[#17101f] to-brand-dark text-white font-body">

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand column */}
          <div className="md:col-span-2 lg:col-span-1">
            <Logo />
            <p className="text-white/60 mt-5 mb-6 text-sm leading-relaxed max-w-xs">
              Tu salón de belleza de confianza en Basauri y Galdakao. Expertas en manicura, pedicura y tratamientos premium.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-rose-gold flex items-center justify-center transition-colors duration-200"
                >
                  <s.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Sedes */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="hidden md:block text-sm font-bold uppercase tracking-widest text-brand-rose-200 mb-5">
              Nuestras Sedes
            </div>
            <div className="md:hidden">
              {/* accordion trigger rendered in FooterAccordion */}
            </div>
            <ul className="space-y-4 mt-4 md:mt-0">
              {locations.map((loc) => (
                <li key={loc.name}>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-brand-rose/20 flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 text-brand-rose-200" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-brand-rose-200 transition-colors">
                        {loc.name}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                        {loc.address}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <p className="hidden md:block text-sm font-bold uppercase tracking-widest text-brand-rose-200 mb-5">
              Navegación
            </p>
            <ul className="space-y-2 mt-4 md:mt-0">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors duration-200 py-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-rose opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & hours */}
          <div>
            <p className="hidden md:block text-sm font-bold uppercase tracking-widest text-brand-rose-200 mb-5">
              Contacto y Horarios
            </p>
            <ul className="space-y-3 mt-4 md:mt-0">
              <li>
                <a
                  href="https://wa.link/f3tn6z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-rose/20 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-brand-rose-200" />
                  </span>
                  631 119 686
                  <span className="text-xs text-white/30 group-hover:text-white/50">(WhatsApp)</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:sulyprettynails@gmail.com"
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-rose/20 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-brand-rose-200" />
                  </span>
                  sulyprettynails@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-brand-rose/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-brand-rose-200" />
                </span>
                <div className="text-sm text-white/60 space-y-0.5">
                  <p>Lun – Vie: 9:00 – 20:00</p>
                  <p>Sábado: 9:00 – 18:00</p>
                  <p className="text-white/35">Domingo: Cerrado</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/35 text-xs">
            © {currentYear} Suly Pretty Nails · Todos los derechos reservados
          </p>
          <p className="flex items-center gap-1.5 text-white/35 text-xs">
            Hecho con <Heart className="h-3 w-3 text-brand-rose fill-current" /> para nuestras clientas
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
