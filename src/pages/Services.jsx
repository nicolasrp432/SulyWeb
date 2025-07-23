import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
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
  const { addService, selectedServices } = useBookingCart();

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
      price: '11,90€',
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
      title: 'Manicura adicional',
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
      price: '35,90€',
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
      price: '25,00€',
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
      price: '3,00€',
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
      price: '14,90€',
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
      price: '25,90€',
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
      price: '30,00€',
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
    }
  ];

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  return (
    <>
      <Helmet>
        <title>Servicios - Suly Pretty Nails | Manicura, Pedicura y Tratamientos de Belleza</title>
        <meta name="description" content="Descubre nuestros servicios de belleza: manicura, pedicura, diseños, lifting de pestañas, depilación y henna. Calidad profesional en Basauri y Galdakao." />
      </Helmet>

      <section className="relative pt-32 pb-16 bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">

        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">
              Nuestros Servicios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra gama de servicios diseñados para realzar 
              tu belleza natural con la más alta calidad profesional.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-white border-b sticky top-[64px] lg:top-[80px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <category.icon className="h-5 w-5" />
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr"
          >
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group service-card-hover cursor-pointer h-full flex flex-col"
                onClick={() => setSelectedService(service)}
              >
                <div className="relative">
                  <img  
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={service.title} 
                    src={service.image} />
                  
                  {/* Overlay con texto para indicar que es clickeable */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-gray-800 font-medium text-sm">
                      Click para ver detalles
                    </div>
                  </div>
                  
                  {service.popular && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 z-10">
                      <Star className="h-4 w-4 fill-current" />
                      <span>Popular</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
                      {service.title}
                    </h3>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-2xl font-bold gradient-text">
                        {service.price}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 justify-end">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed flex-grow">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-auto pt-4">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(service);
                      }}
                      className="flex-1 bg-white border border-pink-500 text-pink-500 hover:bg-pink-50 rounded-full font-medium transition-all duration-300 h-10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span>Ver Detalles</span>
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addService(service);
                        toast({
                          title: "Servicio añadido",
                          description: `${service.title} añadido a tu reserva`,
                        });
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium transition-all duration-300 group shadow-lg hover:shadow-xl h-10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Añadir</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-6">
              Paquetes Especiales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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

      {/* Botón flotante para ir a reservas con contador y vista previa */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 left-6 z-40"
      >
        <div className="relative group">
          <Button
            asChild
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Link to="/reservas" className="flex items-center space-x-2">
              <div className="relative">
                <ShoppingBag className="h-6 w-6" />
                {selectedServices.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md"
                  >
                    {selectedServices.length}
                  </motion.div>
                )}
              </div>
              <span className="hidden sm:inline font-medium">Ver Reservas ({selectedServices.length})</span>
            </Link>
          </Button>
          
          {/* Vista previa de servicios */}
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              whileHover={{ opacity: 1, x: 0, scale: 1 }}
              className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-4 w-80 max-h-60 overflow-y-auto opacity-0 group-hover:opacity-100 transition-all duration-300 border border-gray-200"
            >
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-pink-500" />
                Servicios Seleccionados ({selectedServices.length})
              </h4>
              <div className="space-y-2">
                {selectedServices.slice(0, 3).map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{service.title}</p>
                      <p className="text-xs text-gray-500">{service.duration}</p>
                    </div>
                    <div className="text-sm font-bold text-pink-600 ml-2">
                      {service.price}
                    </div>
                  </div>
                ))}
                {selectedServices.length > 3 && (
                  <div className="text-center text-xs text-gray-500 pt-2 border-t">
                    +{selectedServices.length - 3} servicios más
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total:</span>
                  <span className="text-lg font-bold gradient-text">
                    {selectedServices.reduce((total, service) => {
                      const price = parseFloat(service.price.replace('€', '').replace(',', '.'));
                      return total + price;
                    }, 0).toFixed(2).replace('.', ',')}€
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Services;