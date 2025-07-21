import React, { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MESSAGES, CONFIG } from '@/constants';

const BookingCartContext = createContext();

export const useBookingCart = () => {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error('useBookingCart must be used within a BookingCartProvider');
  }
  return context;
};

export const BookingCartProvider = ({ children }) => {
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useLocalStorage(CONFIG.STORAGE_KEYS.BOOKING_CART, []);

  const addService = useCallback((service) => {
    const isAlreadySelected = selectedServices.some(s => s.id === service.id);
    
    if (isAlreadySelected) {
      toast({
        title: "Servicio ya añadido",
        description: "Este servicio ya está en tu reserva.",
        duration: CONFIG.TOAST.DEFAULT_DURATION,
      });
      return;
    }

    setSelectedServices(prev => [...prev, service]);
    toast({
      title: MESSAGES.SUCCESS.SERVICE_ADDED,
      description: `${service.title} ha sido añadido a tu reserva.`,
      duration: CONFIG.TOAST.DEFAULT_DURATION,
    });
  }, [selectedServices, setSelectedServices, toast]);

  const removeService = useCallback((serviceId) => {
    setSelectedServices(prev => prev.filter(service => service.id !== serviceId));
    toast({
      title: MESSAGES.SUCCESS.SERVICE_REMOVED,
      description: "El servicio ha sido eliminado de tu reserva.",
      duration: CONFIG.TOAST.DEFAULT_DURATION,
    });
  }, [setSelectedServices, toast]);

  const clearServices = useCallback(() => {
    setSelectedServices([]);
    toast({
      title: MESSAGES.SUCCESS.CART_CLEARED,
      description: "Todos los servicios han sido eliminados.",
      duration: CONFIG.TOAST.DEFAULT_DURATION,
    });
  }, [setSelectedServices, toast]);

  const value = {
    selectedServices,
    addService,
    removeService,
    clearServices,
  };

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
};