import React, { memo } from 'react';
import { User, Phone, Mail, MessageSquare } from 'lucide-react';

const PersonalDataStep = memo(({ 
  bookingData, 
  locations, 
  services, 
  selectedServices, 
  availableDates, 
  onInputChange 
}) => {
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
            value={bookingData.name} 
            onChange={(e) => onInputChange('name', e.target.value)} 
            className="w-full px-4 py-3 border rounded-lg" 
            placeholder="Tu nombre" 
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />Teléfono *
          </label>
          <input 
            type="tel" 
            value={bookingData.phone} 
            onChange={(e) => onInputChange('phone', e.target.value)} 
            className="w-full px-4 py-3 border rounded-lg" 
            placeholder="Tu teléfono" 
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="h-4 w-4 inline mr-2" />Email *
        </label>
        <input 
          type="email" 
          value={bookingData.email} 
          onChange={(e) => onInputChange('email', e.target.value)} 
          className="w-full px-4 py-3 border rounded-lg" 
          placeholder="tu@email.com" 
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-2" />Notas
        </label>
        <textarea 
          value={bookingData.notes} 
          onChange={(e) => onInputChange('notes', e.target.value)} 
          rows={3} 
          className="w-full px-4 py-3 border rounded-lg" 
          placeholder="Alergias, preferencias..."
        />
      </div>
    </div>
  );
});

PersonalDataStep.displayName = 'PersonalDataStep';

export default PersonalDataStep;