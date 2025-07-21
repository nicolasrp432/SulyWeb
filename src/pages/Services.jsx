import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Star, 
  ArrowRight,
  Palette,
  Eye,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const Services = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: Sparkles },
    { id: 'nails', name: 'Uñas', icon: Palette },
    { id: 'beauty', name: 'Belleza y Depilación', icon: Eye }
  ];

  const services = [
    {
      id: 1,
      category: 'nails',
      title: 'Manicura Clásica',
      description: 'Cuidado completo de uñas con limado, cutículas y esmaltado tradicional.',
      duration: '45 min',
      price: '25€',
      image: 'Classic manicure with elegant pink nail polish being applied',
      features: ['Limado profesional', 'Cuidado de cutículas', 'Esmaltado tradicional', 'Masaje de manos'],
      popular: false
    },
    {
      id: 2,
      category: 'nails',
      title: 'Manicura Gel',
      description: 'Esmalte gel de larga duración para uñas perfectas hasta por 3 semanas.',
      duration: '60 min',
      price: '35€',
      image: 'Woman showing off her glossy gel manicure with long-lasting color',
      features: ['Preparación profesional', 'Esmalte gel premium', 'Secado UV/LED', 'Duración 3 semanas'],
      popular: true
    },
    {
      id: 3,
      category: 'nails',
      title: 'Manicura Semipermanente',
      description: 'La combinación perfecta de durabilidad y cuidado para tus uñas naturales.',
      duration: '50 min',
      price: '30€',
      image: 'A close-up of a flawless semi-permanent manicure with a natural shine',
      features: ['Fórmula híbrida', 'Fácil remoción', 'Cuidado natural', 'Duración 2 semanas'],
      popular: false
    },
    {
      id: 4,
      category: 'nails',
      title: 'Pedicura Clásica',
      description: 'Cuidado completo de pies con exfoliación, hidratación y esmaltado.',
      duration: '60 min',
      price: '30€',
      image: 'Feet soaking in a bowl of water during a classic pedicure',
      features: ['Remojo relajante', 'Exfoliación', 'Cuidado de durezas', 'Masaje de pies'],
      popular: false
    },
    {
      id: 5,
      category: 'nails',
      title: 'Pedicura Spa',
      description: 'Una experiencia de lujo para tus pies con tratamiento completo y relajación total.',
      duration: '90 min',
      price: '45€',
      image: 'A luxurious spa pedicure setup with flowers and candles',
      features: ['Baño de pies aromático', 'Exfoliación premium', 'Mascarilla hidratante', 'Masaje relajante'],
      popular: true
    },
    {
      id: 6,
      category: 'nails',
      title: 'Diseños Personalizados',
      description: 'Transforma tus uñas en una obra de arte con diseños creativos y únicos.',
      duration: 'Desde 60 min',
      price: 'Desde 35€',
      image: 'Hand with creative custom nail art featuring intricate designs',
      features: ['Consulta de diseño', 'Técnicas artísticas', 'Materiales premium', 'Acabado profesional'],
      popular: true
    },
    {
      id: 7,
      category: 'beauty',
      title: 'Depilación de Cejas',
      description: 'Consigue un perfilado perfecto de cejas que realza tu mirada natural.',
      duration: '20 min',
      price: '15€',
      image: 'A beautician professionally shaping a client\'s eyebrows',
      features: ['Análisis de visagismo', 'Perfilado preciso', 'Técnica con pinza o cera', 'Acabado calmante'],
      popular: false
    },
    {
      id: 8,
      category: 'beauty',
      title: 'Cejas con Henna',
      description: 'Tinte natural que define, rellena y da color a tus cejas de forma duradera.',
      duration: '45 min',
      price: '25€',
      image: 'Before and after of eyebrows tinted with natural henna',
      features: ['Tinte 100% natural', 'Color personalizado', 'Cubre canas y huecos', 'Duración hasta 6 semanas'],
      popular: true
    },
    {
      id: 9,
      category: 'beauty',
      title: 'Lifting de Pestañas',
      description: 'Curvatura natural y duradera que eleva y alarga tus pestañas sin extensiones.',
      duration: '60 min',
      price: '40€',
      image: 'A close-up of an eye showing the results of an eyelash lifting treatment',
      features: ['Curvatura natural', 'Efecto rímel', 'Duración 6-8 semanas', 'Incluye tinte de pestañas'],
      popular: true
    },
    {
      id: 10,
      category: 'beauty',
      title: 'Depilación Facial con Cera',
      description: 'Depilación profesional de labio superior, mentón o mejillas con cera de alta calidad.',
      duration: '15-30 min',
      price: 'Desde 10€',
      image: 'A professional applying wax for facial hair removal',
      features: ['Cera hipoalergénica', 'Técnica profesional', 'Piel suave y sin vello', 'Resultados duraderos'],
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

                  <Button 
                    asChild
                    className="w-full mt-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium transition-all duration-300 group"
                  >
                    <Link to="/reservas">
                      <span>Reservar Servicio</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
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
    </>
  );
};

export default Services;