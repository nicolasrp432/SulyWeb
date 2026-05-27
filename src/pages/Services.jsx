import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEO/SEOHead';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Sparkles, 
  Clock, 
  Star, 
  ArrowRight,
  Palette,
  Eye,
  Heart,
  Plus,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { useBookingCart } from '@/contexts/BookingCartContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Services = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [dbServices, setDbServices] = useState(null);
  const { addService, selectedServices } = useBookingCart();

  useEffect(() => {
    const fetchServices = () => {
      supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setDbServices(data.map((s) => ({
              id: s.id,
              category: s.category ?? 'nails',
              title: s.name,
              description: s.description ?? '',
              duration: s.duration_minutes ? `${s.duration_minutes} min` : '—',
              price: s.price ?? '',
              image: s.image_url || '/serviciosimg/manicura-expres.jpg',
              features: [],
              popular: false,
            })));
          }
        });
    };

    fetchServices();

    const channel = supabase
      .channel('services-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', icon: Sparkles },
    { id: 'nails', name: 'Manicura y Pedicura', icon: Palette },
    { id: 'beauty', name: 'Pestañas y Depilación', icon: Eye }
  ];

  const services = [
    {
      id: 1,
      category: 'nails',
      title: 'Cortar + limar',
      description: 'Servicio básico para mantener tus uñas en perfecto estado.',
      duration: '30 min',
      price: '9,90€',
      image: '/serviciosimg/cortar-limar.jpg',
      features: ['Corte profesional', 'Limado perfecto', 'Acabado uniforme', 'Servicio rápido'],
      popular: false
    },
    {
      id: 2,
      category: 'nails',
      title: 'Manicura exprés',
      description: 'Servicio rápido para lucir uñas perfectas en poco tiempo.',
      duration: '30 min',
      price: '13,90€',
      image: '/serviciosimg/manicura-expres.jpg',
      features: ['Servicio rápido', 'Limado profesional', 'Cutículas perfectas', 'Esmaltado básico'],
      popular: false
    },
    {
      id: 3,
      category: 'nails',
      title: 'Manicura semi exprés',
      description: 'Manicura con esmalte semipermanente en tiempo reducido.',
      duration: '40 min',
      price: '14,90€',
      image: '/serviciosimg/manicura-semi-expres.jpg',
      features: ['Esmalte semipermanente', 'Duración extendida', 'Acabado brillante', 'Servicio eficiente'],
      popular: true
    },
    {
      id: 4,
      category: 'nails',
      title: 'Manicura tradicional',
      description: 'Servicio completo de manicura con tratamientos adicionales.',
      duration: '45 min',
      price: '16,90€',
      image: '/serviciosimg/manicura-adicional.jpg',
      features: ['Tratamiento completo', 'Hidratación profunda', 'Masaje de manos', 'Acabado perfecto'],
      popular: false
    },
    {
      id: 5,
      category: 'nails',
      title: 'Manicura completa spa',
      description: 'Experiencia spa completa para tus manos con tratamientos premium.',
      duration: '60 min',
      price: '19,90€',
      image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&h=300&fit=crop&crop=center',
      features: ['Exfoliación', 'Mascarilla hidratante', 'Masaje relajante', 'Esmaltado premium'],
      popular: true
    },
    {
      id: 6,
      category: 'nails',
      title: 'Manicura rusa',
      description: 'Técnica especializada para una manicura perfecta y duradera.',
      duration: '60 min',
      price: '25,90€',
      image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500&h=300&fit=crop&crop=center',
      features: ['Técnica especializada', 'Cutículas perfectas', 'Mayor duración', 'Acabado profesional'],
      popular: true
    },
    {
      id: 7,
      category: 'nails',
      title: 'Uñas acrílicas / gel',
      description: 'Extensiones de uñas con materiales de alta calidad para un resultado natural y duradero.',
      duration: '90 min',
      price: '38,90€',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=300&fit=crop&crop=center',
      features: ['Extensiones duraderas', 'Materiales premium', 'Diseño personalizado', 'Acabado natural'],
      popular: true
    },
    {
      id: 8,
      category: 'nails',
      title: 'Uñas baby boomer',
      description: 'Elegante degradado de color que simula una manicura francesa moderna.',
      duration: '90 min',
      price: '38,90€',
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&h=300&fit=crop&crop=center',
      features: ['Degradado elegante', 'Efecto natural', 'Tendencia actual', 'Acabado sofisticado'],
      popular: true
    },
    {
      id: 9,
      category: 'nails',
      title: 'Relleno de acrílico',
      description: 'Mantenimiento para tus uñas acrílicas, conservando su belleza y durabilidad.',
      duration: '60 min',
      price: '28,90€',
      image: '/serviciosimg/relleno-acrilico.jpg',
      features: ['Mantenimiento profesional', 'Corrección de crecimiento', 'Refuerzo estructural', 'Acabado renovado'],
      popular: false
    },
    {
      id: 10,
      category: 'nails',
      title: 'Reparar uña',
      description: 'Solución rápida para uñas dañadas o rotas.',
      duration: '15 min',
      price: '3,50€',
      image: '/serviciosimg/repara-uña.jpg',
      features: ['Reparación rápida', 'Refuerzo estructural', 'Igualación de longitud', 'Acabado natural'],
      popular: false
    },
    {
      id: 11,
      category: 'nails',
      title: 'Retirar acrílico',
      description: 'Eliminación segura y profesional de uñas acrílicas.',
      duration: '30 min',
      price: '10,00€',
      image: '/serviciosimg/quitar-acrilico.jpg',
      features: ['Remoción segura', 'Cuidado de la uña natural', 'Técnica profesional', 'Hidratación posterior'],
      popular: false
    },
    {
      id: 12,
      category: 'nails',
      title: 'Retirar semi',
      description: 'Eliminación de esmalte semipermanente sin dañar la uña natural.',
      duration: '20 min',
      price: '5,00€',
      image: '/serviciosimg/retirar-semi.jpg',
      features: ['Remoción cuidadosa', 'Protección de la uña', 'Técnica profesional', 'Servicio rápido'],
      popular: false
    },
    {
      id: 13,
      category: 'nails',
      title: 'Esmaltar pies',
      description: 'Servicio de esmaltado para lucir unos pies perfectos.',
      duration: '30 min',
      price: '16,90€',
      image: '/serviciosimg/esmaltar-pies.jpg',
      features: ['Esmaltado profesional', 'Colores duraderos', 'Acabado brillante', 'Secado rápido'],
      popular: false
    },
    {
      id: 14,
      category: 'nails',
      title: 'Pedicura completa',
      description: 'Tratamiento integral para pies, incluyendo exfoliación, hidratación y esmaltado.',
      duration: '60 min',
      price: '25,90€',
      image: '/serviciosimg/pedicura-completa.jpg',
      features: ['Exfoliación profunda', 'Tratamiento de durezas', 'Hidratación intensiva', 'Esmaltado perfecto'],
      popular: true
    },
    {
      id: 15,
      category: 'nails',
      title: 'Pedicura completa semi / tradicional',
      description: 'Pedicura integral con opción de esmalte semipermanente o tradicional.',
      duration: '60 min',
      price: '29,90€',
      image: '/serviciosimg/pedicura-completa-semi-tradicional.jpg',
      features: ['Tratamiento completo', 'Opción de acabado', 'Larga duración', 'Resultados profesionales'],
      popular: true
    },
    {
      id: 16,
      category: 'beauty',
      title: 'Lifting de Pestañas',
      description: 'Curvatura natural y duradera que eleva y alarga tus pestañas sin extensiones.',
      duration: '60 min',
      price: '35,00€',
      image: '/serviciosimg/lifting-pestañas.jpg',
      features: ['Curvatura natural', 'Efecto rímel', 'Duración 6-8 semanas', 'Incluye tinte de pestañas'],
      popular: true
    },
    {
      id: 17,
      category: 'beauty',
      title: 'Depilar cejas',
      description: 'Perfilado profesional para realzar tu mirada.',
      duration: '15 min',
      price: '5,00€',
      image: '/serviciosimg/depilar-cejas.jpg',
      features: ['Diseño personalizado', 'Técnica precisa', 'Acabado natural', 'Realza la mirada'],
      popular: false
    },
    {
      id: 18,
      category: 'beauty',
      title: 'Depilar bigote',
      description: 'Depilación suave y efectiva del vello facial superior.',
      duration: '10 min',
      price: '5,00€',
      image: '/serviciosimg/depilar-bigote.jpg',
      features: ['Técnica suave', 'Resultados precisos', 'Piel cuidada', 'Acabado perfecto'],
      popular: false
    },
    {
      id: 19,
      category: 'beauty',
      title: 'Depilar axila',
      description: 'Depilación profesional para axilas suaves y sin irritación.',
      duration: '15 min',
      price: '9,90€',
      image: '/serviciosimg/depilar-axilas.jpg',
      features: ['Técnica profesional', 'Mínima irritación', 'Resultados duraderos', 'Piel cuidada'],
      popular: false
    },
    {
      id: 20,
      category: 'beauty',
      title: 'Depilar rostro entero',
      description: 'Tratamiento completo para eliminar el vello facial de forma profesional.',
      duration: '30 min',
      price: '14,90€',
      image: '/serviciosimg/depilar-rostro-entero.jpg',
      features: ['Tratamiento integral', 'Técnica suave', 'Resultados uniformes', 'Piel radiante'],
      popular: false
    },
        {
      id: 21,
      category: 'beauty',
      title: 'Retirar pestaña',
      description: 'Retirado de pestañas pelo a pelo',
      duration: '30 min',
      price: '5,00€',
      image: '/serviciosimg/retiradodepestañas.jpg',
      features: ['Tratamiento integral', 'Técnica suave', 'Resultados uniformes', 'Piel radiante'],
      popular: false
    }
  ];

  const activeServices = dbServices ?? services;
  const filteredServices = selectedCategory === 'all'
    ? activeServices
    : activeServices.filter(service => service.category === selectedCategory);

  return (
    <>
      <SEOHead 
        page="services"
        customTitle="Servicios de Manicura y Pedicura en Bilbao | Precios desde 5€ | Suly Pretty Nails"
        customDescription="🎨 Servicios profesionales de manicura, pedicura, uñas de gel, lifting de pestañas y depilación en Bilbao. Salón en Basauri y Galdakao. Precios desde 5€. ¡Reserva ya!"
        customKeywords="servicios manicura Bilbao, precios pedicura Basauri, uñas gel Galdakao, lifting pestañas Bilbao, depilación cejas Vizcaya, manicura profesional precio"
        canonicalUrl="/servicios"
      />

      <section className="relative pt-28 pb-14 bg-gradient-cream overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-rose/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-gold/8 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-2">
              <span className="w-6 h-px bg-brand-rose" />
              Lo que Ofrecemos
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h1 className="gradient-text">Nuestros Servicios</h1>
            <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
              Descubre nuestra gama de servicios diseñados para realzar tu belleza natural con la más alta calidad profesional.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-4 sm:py-5 bg-white/90 backdrop-blur-sm border-b border-brand-rose-100 sticky top-[64px] lg:top-[80px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'bg-brand-rose-50 text-brand-mid hover:bg-brand-rose-100 hover:text-brand-rose'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-brand-rose-50/40 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr"
          >
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col hover:-translate-y-1"
                onClick={() => setSelectedService(service)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={service.title}
                    src={service.image}
                  />
                  {/* Permanent bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-card" />

                  {service.popular && (
                    <span className="absolute top-2.5 left-2.5 badge-pill bg-gradient-rose-gold text-white text-[10px] sm:text-xs shadow-rose-sm z-10">
                      <Star className="h-3 w-3 fill-current" /> Popular
                    </span>
                  )}

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                    <span className="glass-effect rounded-full px-3 py-1 text-white text-xs font-semibold">
                      Ver detalles
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  {/* Title + price */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-bold text-brand-dark group-hover:text-brand-rose transition-colors leading-tight">
                      {service.title}
                    </h3>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-bold gradient-text whitespace-nowrap">
                        {service.price}
                      </div>
                      <div className="flex items-center text-xs text-brand-mid/70 justify-end mt-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-brand-mid leading-relaxed flex-grow mb-3 hidden sm:block">
                    {service.description}
                  </p>

                  {/* Feature dots — hidden on mobile to save space */}
                  <div className="hidden sm:block space-y-1.5 mb-4">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs text-brand-mid">
                        <span className="w-1.5 h-1.5 bg-brand-rose rounded-full mr-2 shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={(e) => { e.stopPropagation(); setSelectedService(service); }}
                      size="sm"
                      className="flex-1 border border-brand-rose/40 bg-transparent text-brand-rose hover:bg-brand-rose-50 rounded-full text-xs sm:text-sm h-9"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Ver </span>Detalles
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        addService(service);
                        toast({ title: "Servicio añadido", description: `${service.title} añadido a tu reserva` });
                      }}
                      size="sm"
                      variant="gradient"
                      className="flex-1 rounded-full text-xs sm:text-sm h-9"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-4">
              <span className="w-6 h-px bg-brand-rose" />
              Ahorra más
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h2 className="gradient-text mb-4">Paquetes Especiales</h2>
            <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
              Combina servicios y ahorra con nuestros paquetes diseñados para ti.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
              {/* Paquete Básico */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 h-full flex flex-col"
              >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Paquete Básico</h3>
                <div className="text-3xl font-bold mb-4 gradient-text">35€</div>
                <p className="text-gray-600">Perfecto para empezar</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Manicura exprés
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Esmaltar pies
                </li>
              </ul>
              <Button
                 onClick={() => {
                   const basicPackage = {
                     id: 'package-basic',
                     title: 'Paquete Básico',
                     price: '35,00€',
                     duration: '60 min',
                     category: 'paquetes',
                     description: 'Manicura exprés + Esmaltar pies'
                   };
                   addService(basicPackage);
                   toast({
                     title: "Paquete añadido",
                     description: "Paquete Básico añadido a tu reserva",
                   });
                 }}
                 className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-medium transition-all duration-300 mt-auto"
               >
                 Añadir Paquete
               </Button>
            </motion.div>

            {/* Paquete Premium */}
             <motion.div
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               viewport={{ once: true }}
               className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-8 text-white relative overflow-hidden transform md:scale-105 shadow-2xl h-full flex flex-col"
             >
              <div className="text-center mb-6 relative z-10">
                <h3 className="text-2xl font-bold mb-2">Paquete Premium</h3>
                <div className="text-3xl font-bold mb-4">70€</div>
                <p className="text-pink-100">La experiencia completa de belleza</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-white" />
                  Manicura completa spa
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-white" />
                  Pedicura completa
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-white" />
                  Lifting de Pestañas
                </li>
              </ul>
              <Button
                 onClick={() => {
                   const premiumPackage = {
                     id: 'package-premium',
                     title: 'Paquete Premium',
                     price: '70,00€',
                     duration: '180 min',
                     category: 'paquetes',
                     description: 'Manicura completa spa + Pedicura completa + Lifting de Pestañas'
                   };
                   addService(premiumPackage);
                   toast({
                     title: "Paquete añadido",
                     description: "Paquete Premium añadido a tu reserva",
                   });
                 }}
                 className="w-full bg-white text-pink-600 hover:bg-gray-50 rounded-full py-3 font-medium transition-all duration-300 relative z-10 mt-auto"
               >
                 Añadir Paquete
               </Button>
            </motion.div>

            {/* Paquete Deluxe */}
             <motion.div
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               viewport={{ once: true }}
               className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-pink-200 h-full flex flex-col"
             >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Paquete Deluxe</h3>
                <div className="text-3xl font-bold mb-4 gradient-text">95€</div>
                <p className="text-gray-600">Lujo y relajación total</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Manicura rusa
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Pedicura completa semi
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Lifting de Pestañas
                </li>
                <li className="flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-pink-500" />
                  Depilar rostro entero
                </li>
              </ul>
              <Button
                 onClick={() => {
                   const deluxePackage = {
                     id: 'package-deluxe',
                     title: 'Paquete Deluxe',
                     price: '95,00€',
                     duration: '165 min',
                     category: 'paquetes',
                     description: 'Manicura rusa + Pedicura completa semi + Lifting de Pestañas + Depilar rostro entero'
                   };
                   addService(deluxePackage);
                   toast({
                     title: "Paquete añadido",
                     description: "Paquete Deluxe añadido a tu reserva",
                   });
                 }}
                 className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-medium transition-all duration-300 mt-auto"
               >
                 Añadir Paquete
               </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modal de detalles del servicio */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold gradient-text">{selectedService.title}</DialogTitle>
                <DialogDescription className="text-base text-gray-600 mt-2">
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Imagen y precio */}
                <div className="lg:col-span-2">
                  <img  
                    className="w-full h-64 object-cover rounded-lg" 
                    alt={selectedService.title} 
                    src={selectedService.image} 
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2 text-pink-500" />
                      <span>{selectedService.duration}</span>
                    </div>
                    <div className="text-3xl font-bold gradient-text">
                      {selectedService.price}
                    </div>
                  </div>

                  {/* Características del servicio */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Características del Servicio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedService.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={() => {
                        addService(selectedService);
                        toast({
                          title: "Servicio añadido",
                          description: `${selectedService.title} añadido a tu reserva`,
                        });
                        setSelectedService(null);
                      }}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium transition-all duration-300 group py-3"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      <span>Añadir a mi Reserva</span>
                    </Button>
                  </div>
                </div>
                
                {/* Información del negocio */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold gradient-text mb-2">Suly Pretty Nails</h3>
                    <p className="text-sm text-gray-600">Tu salón de belleza de confianza</p>
                  </div>

                  {/* Ubicaciones */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-pink-500" />
                      Nuestras Ubicaciones
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="font-medium text-gray-800">Basauri</p>
                        <p className="text-sm text-gray-600">Calle Principal 123</p>
                        <p className="text-sm text-gray-600">48970 Basauri, Bizkaia</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="font-medium text-gray-800">Galdakao</p>
                        <p className="text-sm text-gray-600">Avenida Central 456</p>
                        <p className="text-sm text-gray-600">48960 Galdakao, Bizkaia</p>
                      </div>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-pink-500" />
                      Contacto
                    </h4>
                    
                    <div className="space-y-2">
                      <a href="tel:+34123456789" className="flex items-center text-gray-600 hover:text-pink-600 transition-colors">
                        <Phone className="h-4 w-4 mr-3 text-pink-500" />
                        <span className="text-sm">+34 123 456 789</span>
                      </a>
                      
                      <a href="mailto:sulyprettynails@gmail.com" className="flex items-center text-gray-600 hover:text-pink-600 transition-colors">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">sulyprettynails@gmail.com</span>
                      </a>
                    </div>
                  </div>

                  {/* Redes sociales */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Síguenos</h4>
                    <div className="flex space-x-3">
                      <a href="https://www.instagram.com/suly_prettynails/" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                        <Instagram className="h-5 w-5 text-pink-500" />
                      </a>
                      <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                        <Facebook className="h-5 w-5 text-pink-500" />
                      </a>
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Horarios</h4>
                    <div className="bg-white rounded-lg p-3 shadow-sm text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lun - Vie:</span>
                        <span className="text-gray-800">9:00 - 20:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sábados:</span>
                        <span className="text-gray-800">9:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domingos:</span>
                        <span className="text-gray-800">Cerrado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating cart button — shown only when there are selected services */}
      {selectedServices.length > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-24 lg:bottom-8 right-4 sm:right-6 z-40"
        >
          <div className="relative group">
            <Button
              asChild
              size="lg"
              className="bg-gradient-rose-gold text-white rounded-2xl shadow-rose-lg hover:shadow-rose-xl pr-5 pl-4"
            >
              <Link to="/reservas" className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <motion.span
                    key={selectedServices.length}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-brand-rose rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow"
                  >
                    {selectedServices.length}
                  </motion.span>
                </div>
                <span className="font-semibold">Reservar</span>
              </Link>
            </Button>

            {/* Popover preview on hover */}
            <div className="absolute bottom-full right-0 mb-3 w-72 bg-white rounded-2xl shadow-rose-lg border border-brand-rose-100 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 translate-y-2 group-hover:translate-y-0">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-rose mb-3">
                Servicios seleccionados ({selectedServices.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedServices.slice(0, 4).map((service, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-brand-rose-50 last:border-0">
                    <p className="text-sm text-brand-dark font-medium truncate">{service.title}</p>
                    <span className="text-xs font-bold text-brand-rose shrink-0">{service.price}</span>
                  </div>
                ))}
                {selectedServices.length > 4 && (
                  <p className="text-xs text-brand-mid text-center pt-1">+{selectedServices.length - 4} más</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-brand-rose-100 flex justify-between items-center">
                <span className="text-sm text-brand-mid">Total est.</span>
                <span className="font-bold gradient-text">
                  {selectedServices.reduce((t, s) => t + parseFloat(s.price.replace('€', '').replace(',', '.')), 0).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Services;