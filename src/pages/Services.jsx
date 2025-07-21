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
  ShoppingBag
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
  const { addService } = useBookingCart();

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
      image: 'Classic nail trimming and filing service',
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
      image: 'Quick express manicure service',
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
      image: 'Semi-permanent express manicure',
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
      image: 'Complete manicure with additional treatments',
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
      image: 'Luxury spa manicure treatment',
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
      image: 'Russian manicure technique',
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
      image: 'Acrylic or gel nail extensions',
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
      image: 'Baby boomer nail design',
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
      image: 'Acrylic nail fill service',
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
      image: 'Nail repair service',
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
      image: 'Acrylic nail removal service',
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
      image: 'Semi-permanent polish removal',
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
      image: 'Feet nail polish service',
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
      image: 'Complete pedicure treatment',
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
      image: 'Complete pedicure with semi-permanent or traditional polish',
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
      image: 'A close-up of an eye showing the results of an eyelash lifting treatment',
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
      image: 'Eyebrow waxing service',
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
      image: 'Upper lip waxing service',
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
      image: 'Underarm waxing service',
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
      image: 'Full face waxing service',
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

      <section className="relative pt-20 pb-16 bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img  
            class="w-full h-full object-cover" 
            alt="Beautiful nail salon services background" src="https://images.unsplash.com/photo-1460980445968-0a5d622f295b" />
        </div>
        
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

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group service-card-hover"
              >
                <div className="relative">
                  <img  
                    class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={service.title} src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
                  
                  {service.popular && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 z-10">
                      <Star className="h-4 w-4 fill-current" />
                      <span>Popular</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="p-6 flex flex-col h-full">
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

                  <div className="flex gap-2 mt-auto">
                    <Button 
                      onClick={() => setSelectedService(service)}
                      className="flex-1 bg-white border border-pink-500 text-pink-500 hover:bg-pink-50 rounded-full font-medium transition-all duration-300"
                    >
                      <span>Ver Detalles</span>
                    </Button>
                    <Button 
                      onClick={() => {
                        addService(service);
                        toast({
                          title: "Servicio añadido",
                          description: `${service.title} añadido a tu reserva`,
                        });
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium transition-all duration-300 group"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-8 text-white relative overflow-hidden transform md:scale-105 shadow-2xl"
            >
              <div className="absolute top-4 right-4 bg-white text-pink-600 px-3 py-1 rounded-full text-sm font-medium z-10">
                Más Popular
              </div>
              <div className="text-center mb-6 relative z-10">
                <h3 className="text-2xl font-bold mb-2">Paquete Premium</h3>
                <div className="text-3xl font-bold mb-4">85€</div>
                <p className="text-pink-100">La experiencia completa de belleza</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                {[ 'Manicura Gel', 'Pedicura Spa', 'Lifting de Pestañas'].map(item => (
                   <li key={item} className="flex items-center">
                    <Heart className="h-4 w-4 mr-3 text-white"/>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-white text-pink-600 hover:bg-gray-50 rounded-full font-medium relative z-10">
                <Link to="/reservas">Reservar Paquete</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modal de detalles del servicio */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-3xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold gradient-text">{selectedService.title}</DialogTitle>
                <DialogDescription className="text-base text-gray-600 mt-2">
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <img  
                    className="w-full h-64 object-cover rounded-lg" 
                    alt={selectedService.title} 
                    src="https://images.unsplash.com/photo-1595872018818-97555653a011" 
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2 text-pink-500" />
                      <span>{selectedService.duration}</span>
                    </div>
                    <div className="text-2xl font-bold gradient-text">
                      {selectedService.price}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Características</h3>
                  <div className="space-y-2">
                    {selectedService.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        addService(selectedService);
                        toast({
                          title: "Servicio añadido",
                          description: `${selectedService.title} añadido a tu reserva`,
                        });
                        setSelectedService(null);
                      }}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium transition-all duration-300 group"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Añadir a mi Reserva</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Services;