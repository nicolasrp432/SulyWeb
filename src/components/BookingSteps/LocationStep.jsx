import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';

const LocationStep = memo(({ locations, loading, selectedLocation, onLocationSelect }) => {
  if (loading) {
    return <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-500" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {locations.map((loc) => (
        <motion.div 
          key={loc.id} 
          whileHover={{ scale: 1.02 }} 
          onClick={() => onLocationSelect(loc.id)} 
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
            selectedLocation === loc.id 
              ? 'border-pink-500 bg-pink-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-pink-300'
          }`}
        >
          <MapPin className="h-8 w-8 text-pink-500 mb-4" />
          <h3 className="font-semibold text-xl text-gray-800 mb-2">{loc.name}</h3>
          <p className="text-gray-600">{loc.address}</p>
        </motion.div>
      ))}
    </div>
  );
});

LocationStep.displayName = 'LocationStep';

export default LocationStep;