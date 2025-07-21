import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GoogleReviews = ({ placeId = '0xd4e4ffe4a9f61e5:0x5dacb5bd37d71d04', maxReviews = 5 }) => {
  const [reviews, setReviews] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar el script de Google Maps API
    const googleMapScript = document.createElement('script');
    // Nota: Deberás reemplazar 'YOUR_API_KEY' con tu clave de API de Google Maps
    // Para producción, se recomienda usar variables de entorno
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    googleMapScript.onload = initMap;
    googleMapScript.onerror = () => {
      setError('Error al cargar la API de Google Maps');
      setLoading(false);
    };
    document.body.appendChild(googleMapScript);

    return () => {
      document.body.removeChild(googleMapScript);
    };
  }, [placeId]);

  const initMap = () => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    service.getDetails(
      {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'opening_hours', 'formatted_address', 'url']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          if (place.reviews) {
            setReviews(place.reviews.slice(0, maxReviews));
          }
          setBusinessInfo({
            name: place.name,
            rating: place.rating,
            address: place.formatted_address,
            openingHours: place.opening_hours?.weekday_text || [],
            url: place.url
          });
        } else {
          setError(`Error al obtener datos: ${status}`);
        }
        setLoading(false);
      }
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars && halfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-5 w-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />);
      }
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <p className="mt-2">Por favor, verifica tu API key o inténtalo más tarde.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {businessInfo && (
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-bold mb-2">{businessInfo.name}</h3>
          <div className="flex justify-center items-center mb-2">
            {renderStars(businessInfo.rating)}
            <span className="ml-2 text-lg font-semibold">{businessInfo.rating.toFixed(1)}</span>
          </div>
          <p className="text-gray-600 mb-4">{businessInfo.address}</p>
          
          {businessInfo.openingHours.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 flex items-center justify-center">
                <Clock className="h-5 w-5 mr-2" />
                Horario
              </h4>
              <ul className="space-y-1 max-w-md mx-auto text-sm">
                {businessInfo.openingHours.map((day, index) => (
                  <li key={index} className="text-gray-600">{day}</li>
                ))}
              </ul>
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => window.open(businessInfo.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver en Google Maps
          </Button>
        </div>
      )}

      <h3 className="text-2xl font-bold text-center mb-6 gradient-text">Reseñas de Google</h3>
      
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                {review.profile_photo_url && (
                  <img 
                    src={review.profile_photo_url} 
                    alt={review.author_name} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{review.author_name}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(review.time * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {renderStars(review.rating)}
              </div>
              
              <p className="text-gray-600 text-sm">{review.text}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No hay reseñas disponibles.</p>
      )}
    </div>
  );
};

export default GoogleReviews;