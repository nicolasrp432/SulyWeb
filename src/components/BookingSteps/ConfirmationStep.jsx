import React, { memo, useMemo } from 'react';
import { CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTACT_INFO } from '@/constants';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function onlyDigits(value) {
  return (value || '').toString().replace(/[^0-9]/g, '');
}

const ConfirmationStep = memo(({ onResetBooking, bookingData, services, locationName }) => {
  const waLink = useMemo(() => {
    const storeNumber = onlyDigits(CONTACT_INFO?.WHATSAPP);
    if (!storeNumber) return '';

    const serviceLines = (services || [])
      .map(s => `- ${s.name}${s.price ? ` - ${s.price}` : ''}`)
      .join('\n');

    const text = [
      'Nueva reserva',
      `Nombre: ${bookingData?.name || ''}`,
      `Teléfono: ${bookingData?.phone || ''}`,
      `Email: ${bookingData?.email || ''}`,
      `Fecha: ${formatDate(bookingData?.date)}`,
      `Hora: ${bookingData?.time || ''}`,
      `Ubicación: ${locationName || ''}`,
      serviceLines ? 'Servicios:\n' + serviceLines : '',
      bookingData?.notes ? `Notas: ${bookingData.notes}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/${storeNumber}?text=${encodeURIComponent(text)}`;
  }, [bookingData, services, locationName]);

  return (
    <div className="text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Tu solicitud de reserva ha sido enviada. Recibirás una confirmación por WhatsApp en breve. ¡Gracias por confiar en nosotras!
      </p>
      <div className="flex flex-col items-center gap-3">
        {waLink ? (
          <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex">
            <Button className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Enviar detalles a WhatsApp de la tienda
            </Button>
          </a>
        ) : null}
        <Button 
          onClick={onResetBooking} 
          variant={waLink ? 'outline' : 'default'}
          className={waLink ? '' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'}
        >
          Hacer Otra Reserva
        </Button>
      </div>
    </div>
  );
});

ConfirmationStep.displayName = 'ConfirmationStep';

export default ConfirmationStep;