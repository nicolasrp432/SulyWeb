import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState — estado vacío compartido para listas del panel admin.
 * Mantiene la identidad rosa/dorada: icono en círculo rosa suave,
 * título Montserrat y acción opcional con gradiente rose-gold.
 */
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    {Icon && (
      <div className="w-12 h-12 rounded-full bg-brand-rose/10 text-brand-rose flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
    )}
    <p className="text-sm font-bold text-admin-text">{title}</p>
    {description && (
      <p className="text-xs text-admin-muted mt-1 max-w-xs mx-auto">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button
        size="sm"
        onClick={onAction}
        className="mt-4 bg-gradient-rose-gold text-white font-bold rounded-lg shadow-rose-sm hover:shadow-rose-md hover:brightness-105"
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
