import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const STATIC_ITEMS = [
  { id: 1, category: 'manicure', title: 'Manicura Elegante',  description: 'Manicura profesional con acabado perfecto.', image_url: '/Gallery/manicura1.jpeg', featured: true },
  { id: 2, category: 'manicure', title: 'Diseño Especial',    description: 'Manicura con diseño único y personalizado.', image_url: '/Gallery/Manicura2.jpeg', featured: false },
  { id: 3, category: 'manicure', title: 'Manicura Clásica',   description: 'La elegancia de la manicura tradicional.',   image_url: '/Gallery/manicura3.jpeg', featured: true },
  { id: 4, category: 'manicure', title: 'Manicura Premium',   description: 'Manicura de alta calidad con acabado profesional.', image_url: '/Gallery/manicura4.jpeg', featured: false },
];

const Gallery = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryItems, setGalleryItems] = useState(STATIC_ITEMS);

  useEffect(() => {
    supabase
      .from('gallery_images')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setGalleryItems(data);
      });
  }, []);

  const categories = [
    { id: 'all',        name: 'Todas' },
    { id: 'manicure',   name: 'Manicura' },
    { id: 'pedicure',   name: 'Pedicura' },
    { id: 'nail-art',   name: 'Diseños' },
    { id: 'treatments', name: 'Tratamientos' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === selectedCategory);

  const handleActionClick = (e) => {
    e.stopPropagation();
    toast({
      title: "Función en desarrollo",
      description: "Esta interacción estará disponible muy pronto.",
      duration: 3000,
    });
  };

  const navigateLightbox = (direction) => {
    const idx = filteredItems.findIndex((i) => i.id === selectedImage.id);
    const next = (idx + direction + filteredItems.length) % filteredItems.length;
    setSelectedImage(filteredItems[next]);
  };

  return (
    <>
      <Helmet>
        <title>Galería - Suly Pretty Nails | Nuestros Trabajos</title>
        <meta name="description" content="Explora nuestra galería de manicuras, pedicuras, diseños de uñas y tratamientos. Inspiración para tu próxima cita en Basauri o Galdakao." />
      </Helmet>

      {/* ── Page header ── */}
      <section className="relative pt-28 pb-14 bg-gradient-cream overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img
            className="w-full h-full object-cover opacity-[0.04]"
            alt=""
            src="https://images.unsplash.com/photo-1595872018818-97555653a011?auto=format&fit=crop&w=2070&q=60"
          />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-rose/6 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
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
              Inspiración
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h1 className="gradient-text">Nuestra Galería</h1>
            <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
              Descubre nuestros trabajos y encuentra la inspiración para tu próxima visita.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Category filters ── */}
      <section className="py-4 sm:py-5 bg-white/90 backdrop-blur-sm border-b border-brand-rose-100 sticky top-[64px] lg:top-[80px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'bg-brand-rose-50 text-brand-mid hover:bg-brand-rose-100 hover:text-brand-rose'
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery grid — CSS masonry columns ── */}
      <section className="py-12 sm:py-16 bg-brand-rose-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                className="break-inside-avoid mb-3 sm:mb-4 group cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
                  {item.featured && (
                    <span className="absolute top-2.5 left-2.5 z-10 badge-pill bg-gradient-rose-gold text-white text-[10px] shadow-rose-sm">
                      Destacado
                    </span>
                  )}

                  <img
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={item.title}
                    src={item.image_url}
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-sm leading-tight">{item.title}</h3>
                      <p className="text-white/75 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      <button
                        onClick={handleActionClick}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      >
                        <Heart className="h-3.5 w-3.5 text-brand-rose" />
                      </button>
                      <button
                        onClick={handleActionClick}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      >
                        <Share2 className="h-3.5 w-3.5 text-brand-mid" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-24 text-brand-mid">
              <p className="text-lg">No hay fotos en esta categoría todavía.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/90 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Nav arrows */}
              {filteredItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <img
                className="w-full max-h-[60vh] object-contain bg-brand-dark"
                alt={selectedImage.title}
                src={selectedImage.image_url}
              />

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark">{selectedImage.title}</h2>
                    <p className="text-sm text-brand-mid mt-0.5">{selectedImage.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-rose ml-4 shrink-0">
                    <Heart className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{selectedImage.likes}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleActionClick} variant="outline" size="sm" className="rounded-full border-brand-rose/40 text-brand-rose">
                    <Heart className="h-4 w-4 mr-1.5" /> Me Gusta
                  </Button>
                  <Button onClick={handleActionClick} variant="gradient" size="sm" className="rounded-full">
                    <Share2 className="h-4 w-4 mr-1.5" /> Compartir
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-br from-brand-rose via-rose-600 to-brand-rose-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="font-sans font-bold text-white" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              ¿Te has inspirado?
            </h2>
            <p className="text-white/85 text-lg max-w-lg mx-auto leading-relaxed">
              Reserva tu cita y hagamos realidad el diseño de tus sueños.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-brand-rose hover:bg-brand-rose-50 px-8 rounded-full font-bold shadow-xl"
            >
              <Link to="/reservas" className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reservar Mi Cita
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Gallery;
