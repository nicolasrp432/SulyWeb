import React, { useEffect, useRef, useState } from 'react';
import {
  Check, CheckCheck, Mail, MessageCircle, MoreVertical, Phone, X,
} from 'lucide-react';

const BookingActionMenu = ({
  booking,
  onConfirm,
  onComplete,
  onCancel,
  onWa,
  onCall,
  onEmail,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const status = booking?.meta?.status || booking?.status || 'pending';

  const items = [
    {
      key: 'confirm',
      label: 'Confirmar',
      icon: Check,
      color: 'text-emerald-700 hover:bg-emerald-50',
      disabled: status === 'confirmed',
      action: () => onConfirm?.(booking),
    },
    {
      key: 'complete',
      label: 'Completar',
      icon: CheckCheck,
      color: 'text-blue-700 hover:bg-blue-50',
      disabled: status === 'completed',
      action: () => onComplete?.(booking),
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      icon: X,
      color: 'text-rose-700 hover:bg-rose-50',
      disabled: status === 'cancelled',
      action: () => {
        if (window.confirm(`¿Cancelar la cita de ${booking?.client_name || 'este cliente'}?`)) {
          onCancel?.(booking);
        }
      },
    },
    {
      key: 'wa',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-700 hover:bg-green-50',
      disabled: !booking?.client_phone,
      action: () => onWa?.(booking),
    },
    {
      key: 'call',
      label: 'Llamar',
      icon: Phone,
      color: 'text-admin-text hover:bg-admin-surface',
      disabled: !booking?.client_phone,
      action: () => onCall?.(booking),
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      color: 'text-blue-700 hover:bg-blue-50',
      disabled: !booking?.client_email,
      action: () => onEmail?.(booking),
    },
  ];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-full text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
        aria-label="Acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-admin-border bg-white shadow-2xl py-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                type="button"
                disabled={it.disabled}
                onClick={() => { it.action(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${it.color}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingActionMenu;
