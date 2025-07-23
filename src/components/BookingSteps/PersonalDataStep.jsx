import React, { memo, useEffect } from 'react';
import { User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useBookingForm } from '@/hooks/useFormValidation';

const PersonalDataStep = memo(({ 
  bookingData, 
  locations, 
  services, 
  selectedServices, 
  availableDates, 
  onInputChange 
}) => {
  const {
    register,
    handleSubmit,
    getFieldError,
    hasFieldError,
    reset,
    errors,
    setValue,
    watch
  } = useBookingForm();

  // Sincronizar valores del formulario con bookingData
  useEffect(() => {
    setValue('name', bookingData.name || '');
    setValue('phone', bookingData.phone || '');
    setValue('email', bookingData.email || '');
    setValue('notes', bookingData.notes || '');
  }, [bookingData, setValue]);

  // Observar cambios en el formulario y propagarlos
  const watchedValues = watch();
  useEffect(() => {
    if (watchedValues.name !== bookingData.name) {
      onInputChange('name', watchedValues.name || '');
    }
    if (watchedValues.phone !== bookingData.phone) {
      onInputChange('phone', watchedValues.phone || '');
    }
    if (watchedValues.email !== bookingData.email) {
      onInputChange('email', watchedValues.email || '');
    }
    if (watchedValues.notes !== bookingData.notes) {
      onInputChange('notes', watchedValues.notes || '');
    }
  }, [watchedValues, bookingData, onInputChange]);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border-2 border-pink-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de tu Reserva</h3>
        <div className="space-y-3">
          <p><strong>Sede:</strong> {locations.find(l => l.id === bookingData.location)?.name}</p>
          <div>
            <p className="font-semibold mb-2">Servicios:</p>
            <ul className="list-disc pl-5 space-y-1">
              {bookingData.services.map(serviceId => {
                const service = services.find(s => s.id === serviceId) || 
                               selectedServices.find(s => s.id === serviceId);
                if (!service) return null;
                return (
                  <li key={serviceId}>
                    {service.name || service.title} - {service.price}
                  </li>
                );
              })}
            </ul>
          </div>
          <p>
            <strong>Fecha:</strong> {availableDates.find(d => d.date === bookingData.date)?.display} a las {bookingData.time}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-2" />Nombre *
          </label>
          <input 
            type="text" 
            {...register('name')}
            className={`w-full px-4 py-3 border rounded-lg ${
              hasFieldError('name') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-pink-500'
            }`}
            placeholder="Tu nombre" 
          />
          {hasFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />Teléfono *
          </label>
          <input 
            type="tel" 
            {...register('phone')}
            className={`w-full px-4 py-3 border rounded-lg ${
              hasFieldError('phone') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-pink-500'
            }`}
            placeholder="Tu teléfono" 
          />
          {hasFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="h-4 w-4 inline mr-2" />Email *
        </label>
        <input 
          type="email" 
          {...register('email')}
          className={`w-full px-4 py-3 border rounded-lg ${
            hasFieldError('email') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-pink-500'
          }`}
          placeholder="tu@email.com" 
        />
        {hasFieldError('email') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-2" />Notas
        </label>
        <textarea 
          {...register('notes')}
          rows={3} 
          className="w-full px-4 py-3 border rounded-lg border-gray-300 focus:border-pink-500" 
          placeholder="Alergias, preferencias..."
        />
      </div>
    </div>
  );
});

PersonalDataStep.displayName = 'PersonalDataStep';

export default PersonalDataStep;