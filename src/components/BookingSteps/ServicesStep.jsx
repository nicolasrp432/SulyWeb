import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles, ShoppingBag, Plus, X, Loader2 } from 'lucide-react';
import { getServiceImageFromObj } from '@/lib/serviceImages';

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
              const imageUrl = getServiceImageFromObj(service);
              return (
                <div key={service.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                  {/* Service image thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-pink-100">
                    <img 
                      src={imageUrl}
                      alt={service.name || service.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/serviciosimg/manicura-expres.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{service.name || service.title}</h4>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />{service.duration || `${service.duration_minutes} min`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
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
        {services.map((service) => {
          const imageUrl = getServiceImageFromObj(service);
          return (
            <motion.div 
              key={service.id} 
              whileHover={{ scale: 1.02 }} 
              onClick={() => onServiceSelect(service.id)} 
              className={`rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                selectedServiceIds.includes(service.id) 
                  ? 'border-pink-500 bg-pink-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              {/* Service image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-pink-100">
                <img 
                  src={imageUrl}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/serviciosimg/manicura-expres.jpg'; }}
                />
                {selectedServiceIds.includes(service.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
              
              {/* Service info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{service.name}</h3>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes ? `${service.duration_minutes} min` : service.duration}
                  </span>
                  <span className="font-bold text-pink-600">{service.price}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
});

ServicesStep.displayName = 'ServicesStep';

export default ServicesStep;
