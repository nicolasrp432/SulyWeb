import React from 'react';
import { X, Clock, Euro } from 'lucide-react';
import { useBookingCart } from '@/contexts/BookingCartContext';
import { motion } from 'framer-motion';

const BookingCartSummary = () => {
  const { selectedServices, removeService, clearCart } = useBookingCart();
  
  if (selectedServices.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No has seleccionado ningún servicio</p>
        <p className="text-sm text-gray-400 mt-2">Añade servicios desde la página de servicios</p>
      </div>
    );
  }
  
  // Calcular el total
  const total = selectedServices.reduce((sum, service) => {
    const price = parseFloat(service.price.replace('€', '').replace(',', '.'));
    return sum + price;
  }, 0);
  
  // Calcular la duración total en minutos
  const totalDuration = selectedServices.reduce((sum, service) => {
    const durationMatch = service.duration.match(/(\d+)\s*min/);
    return sum + (durationMatch ? parseInt(durationMatch[1]) : 0);
  }, 0);
  
  // Convertir minutos a formato horas y minutos
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const formattedDuration = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}` 
    : `${minutes}min`;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Servicios seleccionados</h3>
        {selectedServices.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs text-rose-500 hover:text-rose-700 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>
      
      <div className="space-y-3 mb-4">
        {selectedServices.map((service) => (
          <motion.div 
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
          >
            <div>
              <p className="font-medium">{service.title}</p>
              <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-center">
                  <Euro className="h-3 w-3 mr-1" />
                  <span>{service.price}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => removeService(service.id)}
              className="text-gray-400 hover:text-rose-500 transition-colors"
              aria-label="Eliminar servicio"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        ))}
      </div>
      
      <div className="border-t pt-3">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Duración total:</span>
          <span className="font-medium">{formattedDuration}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>{total.toFixed(2).replace('.', ',')}€</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCartSummary;