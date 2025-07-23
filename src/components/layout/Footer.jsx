import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Facebook, 
  Heart 
} from 'lucide-react';
import Logo from '@/components/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: 'https://www.instagram.com/suly_prettynails/', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' }
  ];

  const quickLinks = [
    { name: 'Servicios', path: '/servicios' },
    { name: 'Galería', path: '/galeria' },
    { name: 'Reservas', path: '/reservas' },
    { name: 'Contacto', path: '/contacto' }
  ];

  const services = [
    'Manicura Gel',
    'Pedicura Spa',
    'Lifting de Pestañas',
    'Depilación con Henna',
    'Diseños Personalizados',
  ];

  const locations = [
    { name: 'Sede Basauri', address: 'Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia' },
    { name: 'Sede Galdakao', address: 'Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia' }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-sans">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="text-gray-300 mt-6 mb-6 leading-relaxed">
              Tu salón de belleza en Basauri y Galdakao. Expertas en manicura, pedicura y tratamientos de belleza.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <span className="text-lg font-semibold text-pink-400 mb-6 block">
              Nuestras Sedes
            </span>
            <ul className="space-y-4">
              {locations.map((loc) => (
                <li key={loc.name} className="flex items-start space-x-3">
                   <MapPin className="h-5 w-5 text-pink-400 mt-1 flex-shrink-0" />
                   <div>
                     <p className="font-semibold">{loc.name}</p>
                     <p className="text-gray-300 text-sm">{loc.address}</p>
                   </div>
                </li>
              ))}
            </ul>
          </div>
          

          {/* Quick Links */}
          <div>
            <span className="text-lg font-semibold text-pink-400 mb-6 block">
              Enlaces Rápidos
            </span>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-pink-400 transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <span className="text-lg font-semibold text-pink-400 mb-6 block">
              Contacto y Horarios
            </span>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <a href="https://wa.link/f3tn6z" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400">631 119 686 (Solo WhatsApp)</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <p className="text-gray-300">sulyprettynails@gmail.com</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-pink-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Lun - Vie: 9:00 - 20:00</p>
                  <p className="text-gray-300">Sáb: 9:00 - 18:00</p>
                  <p className="text-gray-300">Dom: Cerrado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400 text-sm text-center md:text-left">
              <span>© {currentYear}</span>
              <span>Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 text-pink-400" />
              <span>para nuestras clientas</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;