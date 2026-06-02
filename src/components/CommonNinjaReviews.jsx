import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const COMMONNINJA_SDK = 'https://cdn.commoninja.com/sdk/latest/commonninja.js';

// Este componente integra el widget de reseñas de CommonNinja.
// El SDK de terceros se carga aquí bajo demanda (no globalmente en index.html)
// para que sus estilos y scripts solo se ejecuten en la página de Inicio,
// donde existe el div .commonninja_component, y no contaminen /reservas etc.
const CommonNinjaReviews = () => {
  useEffect(() => {
    // Si ya está cargado, el SDK detecta el widget por su MutationObserver.
    if (document.querySelector(`script[src="${COMMONNINJA_SDK}"]`)) return;

    const script = document.createElement('script');
    script.src = COMMONNINJA_SDK;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

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
