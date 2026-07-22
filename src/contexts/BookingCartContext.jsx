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

  // Añade varios servicios a la vez (p. ej. los que componen un paquete) sin
  // emitir un toast por cada uno. Deduplica contra lo ya seleccionado.
  const addServices = useCallback((servicesToAdd = []) => {
    const valid = servicesToAdd.filter((s) => s && s.id != null);
    if (valid.length === 0) return 0;
    let addedCount = 0;
    setSelectedServices((prev) => {
      const existing = new Set(prev.map((s) => s.id));
      const fresh = valid.filter((s) => !existing.has(s.id));
      addedCount = fresh.length;
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    return addedCount;
  }, [setSelectedServices]);

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
    addServices,
    removeService,
    clearServices,
  };

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
};