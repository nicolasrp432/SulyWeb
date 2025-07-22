import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingCart } from '@/contexts/BookingCartContext';

const BookingCartIndicator = () => {
  const { selectedServices } = useBookingCart();
  const [showNotification, setShowNotification] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  
  useEffect(() => {
    if (selectedServices.length > prevCount && prevCount > 0) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevCount(selectedServices.length);
  }, [selectedServices.length, prevCount]);
  
  if (selectedServices.length === 0) return null;
  
  return (
    <>
      <Link to="/reservas">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="sticky bottom-24 right-6 z-[50] bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full p-4 shadow-lg flex items-center space-x-2 min-w-[120px] justify-center transform-gpu will-change-transform"
          style={{
            position: 'sticky',
            bottom: '96px',
            right: '24px',
            zIndex: 50
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          key={selectedServices.length}
        >
          <motion.div
            animate={showNotification ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <ShoppingBag className="h-5 w-5" />
          </motion.div>
          <span className="font-medium text-sm">Reservar ({selectedServices.length})</span>
        </motion.div>
      </Link>
      
      {/* Notificación animada */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="sticky bottom-40 right-6 z-[70] bg-green-500 text-white rounded-lg p-3 shadow-xl flex items-center space-x-2 transform-gpu will-change-transform"
            style={{
              position: 'sticky',
              bottom: '160px',
              right: '24px',
              zIndex: 70
            }}
          >
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 0.6 }}
            >
              <Plus className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium">¡Servicio añadido!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingCartIndicator;