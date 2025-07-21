import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles, ShoppingBag, Plus, X, Loader2 } from 'lucide-react';

const ServicesStep = memo(({ 
  services, 
  selectedServices, 
  selectedServiceIds, 
  loading, 
  onServiceSelect, 
  onServiceRemove 
}) => {
  if (loading) {
    return <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-500" />;
  }

  return (
    <>
      {/* Servicios seleccionados */}
      {selectedServiceIds.length > 0 && (
        <div className="mb-6 bg-pink-50 p-4 rounded-xl border border-pink-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-pink-500" />
            Servicios seleccionados
          </h3>
          <div className="space-y-2">
            {selectedServiceIds.map(serviceId => {
              const service = services.find(s => s.id === serviceId) || 
                             selectedServices.find(s => s.id === serviceId);
              if (!service) return null;
              return (
                <div key={service.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                  <div>
                    <h4 className="font-medium text-gray-800">{service.name || service.title}</h4>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />{service.duration}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-pink-600">{service.price}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onServiceRemove(service.id);
                      }}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Lista de servicios disponibles */}
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
        <Plus className="h-5 w-5 mr-2 text-pink-500" />
        Añadir más servicios
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <motion.div 
            key={service.id} 
            whileHover={{ scale: 1.02 }} 
            onClick={() => onServiceSelect(service.id)} 
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selectedServiceIds.includes(service.id) 
                ? 'border-pink-500 bg-pink-50 shadow-lg' 
                : 'border-gray-200 bg-white hover:border-pink-300'
            }`}
          >
            <Sparkles className="h-6 w-6 text-pink-500 mb-2" />
            <h3 className="font-semibold text-gray-800 mb-2">{service.name}</h3>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span><Clock className="h-4 w-4 inline mr-1" />{service.duration}</span>
              <span className="font-bold text-pink-600">{service.price}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
});

ServicesStep.displayName = 'ServicesStep';

export default ServicesStep;