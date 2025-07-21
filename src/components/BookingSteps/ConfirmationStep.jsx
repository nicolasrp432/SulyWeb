import React, { memo } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmationStep = memo(({ onResetBooking }) => {
  return (
    <div className="text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Tu solicitud de reserva ha sido enviada. Recibirás una confirmación por WhatsApp en breve. ¡Gracias por confiar en nosotras!
      </p>
      <Button 
        onClick={onResetBooking} 
        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"
      >
        Hacer Otra Reserva
      </Button>
    </div>
  );
});

ConfirmationStep.displayName = 'ConfirmationStep';

export default ConfirmationStep;