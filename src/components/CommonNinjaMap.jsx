import React from 'react';
import { motion } from 'framer-motion';

// Este componente integra el widget de mapas de CommonNinja
// No requiere API key de Google Maps y utiliza un simple código HTML para mostrar el mapa
// IMPORTANTE: El usuario debe crear su propio widget de mapa en CommonNinja.com y reemplazar
// el valor de 'pid-REEMPLAZAR-CON-TU-ID' con el ID proporcionado por CommonNinja
const CommonNinjaMap = () => {
  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="commonninja_component pid-REEMPLAZAR-CON-TU-ID"
      ></motion.div>
      <p className="text-center text-sm text-gray-500 mt-4">
        Encuéntranos en nuestras dos sedes: Basauri y Galdakao
      </p>
    </div>
  );
};

export default CommonNinjaMap;