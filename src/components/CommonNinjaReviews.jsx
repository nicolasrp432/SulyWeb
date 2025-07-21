import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

// Este componente integra el widget de reseñas de CommonNinja
// No requiere API key de Google Maps y utiliza un simple código HTML para mostrar las reseñas
const CommonNinjaReviews = () => {
  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="commonninja_component pid-d783d9b8-ae9c-473c-bd64-398bcc395750"
      ></motion.div>
    </div>
  );
};

export default CommonNinjaReviews;