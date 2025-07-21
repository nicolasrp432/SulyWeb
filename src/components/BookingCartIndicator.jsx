import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBookingCart } from '@/contexts/BookingCartContext';

const BookingCartIndicator = () => {
  const { selectedServices } = useBookingCart();
  
  if (selectedServices.length === 0) return null;
  
  return (
    <Link to="/reservas">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full p-3 shadow-lg flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingBag className="h-5 w-5" />
        <span className="font-medium">{selectedServices.length}</span>
      </motion.div>
    </Link>
  );
};

export default BookingCartIndicator;