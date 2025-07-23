import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const Gallery = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const getImageForGalleryItem = (item) => {
    const imageMap = {
      'manicura1': '/Gallery/manicura1.jpeg',
      'manicura2': '/Gallery/Manicura2.jpeg',
      'manicura3': '/Gallery/manicura3.jpeg',
      'manicura4': '/Gallery/manicura4.jpeg'
    };
    return imageMap[item.image] || '/Gallery/manicura1.jpeg';
  };

  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'manicure', name: 'Manicura' },
    { id: 'pedicure', name: 'Pedicura' },
    { id: 'nail-art', name: 'Diseños' },
    { id: 'treatments', name: 'Tratamientos' }
  ];

  const galleryItems = [
    {
      id: 1,
      category: 'manicure',
      title: 'Manicura Elegante',
      description: 'Manicura profesional con acabado perfecto.',
      image: 'manicura1',
      likes: 124,
      featured: true
    },
    {
      id: 2,
      category: 'manicure',
      title: 'Diseño Especial',
      description: 'Manicura con diseño único y personalizado.',
      image: 'manicura2',
      likes: 89,
      featured: false
    },
    {
      id: 3,
      category: 'manicure',
      title: 'Manicura Clásica',
      description: 'La elegancia de la manicura tradicional.',
      image: 'manicura3',
      likes: 156,
      featured: true
    },
    {
      id: 4,
      category: 'manicure',
      title: 'Manicura Premium',
      description: 'Manicura de alta calidad con acabado profesional.',
      image: 'manicura4',
      likes: 78,
      featured: false
    }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const handleImageClick = (item) => {
    setSelectedImage(item);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    toast({
      title: "🚧 ¡Función en desarrollo!",
      description: "Esta interacción estará disponible muy pronto. 🚀",
      duration: 3000,
    });
  };

  return (
    <>
      <Helmet>
        <title>Galería - Suly Pretty Nails | Nuestros Trabajos</title>
        <meta name="description" content="Explora nuestra galería de manicuras, pedicuras, diseños de uñas y tratamientos. Inspiración para tu próxima cita en Basauri o Galdakao." />
      </Helmet>

      <section className="relative pt-32 pb-16 bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img  
            class="w-full h-full object-cover" 
            alt="Beautiful nail art gallery background" src="https://images.unsplash.com/photo-1595872018818-97555653a011?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">
              Nuestra Galería
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros trabajos y encuentra la inspiración 
              para tu próxima visita.
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
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => handleImageClick(item)}
              >
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
                  {item.featured && (
                    <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Destacado
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden">
                    <img  
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={item.title} src={getImageForGalleryItem(item)} />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={handleActionClick}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart className="h-4 w-4 text-pink-500" />
                      </button>
                      <button
                        onClick={handleActionClick}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="relative">
                <img  
                  class="w-full max-h-[70vh] object-contain" 
                  alt={selectedImage.title} src={getImageForGalleryItem(selectedImage)} />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedImage.title}
                    </h2>
                    <p className="text-gray-600">
                      {selectedImage.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-pink-500">
                    <Heart className="h-5 w-5" />
                    <span className="font-medium">{selectedImage.likes}</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleActionClick}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Heart className="h-4 w-4" />
                    <span>Me Gusta</span>
                  </Button>
                  <Button
                    onClick={handleActionClick}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Compartir</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-16 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              ¿Te has inspirado?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Reserva tu cita y hagamos realidad el diseño de tus sueños.
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link to="/reservas">Reservar Mi Cita</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Gallery;