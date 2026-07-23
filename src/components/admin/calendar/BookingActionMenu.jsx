import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, CheckCheck, Mail, MessageCircle, MoreVertical, Phone, Trash2, UserX, X,
} from 'lucide-react';

const MENU_WIDTH = 176; // w-44
const MENU_GAP = 4;

const BookingActionMenu = ({
  booking,
  onConfirm,
  onComplete,
  onCancel,
  onNoShow,
  onWa,
  onCall,
  onEmail,
  onDelete,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuH = menuRef.current?.offsetHeight || 260;

    // Clamp horizontal
    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > vw - 8) left = vw - MENU_WIDTH - 8;

    // Vertical: abre hacia abajo si cabe; si no, hace flip hacia arriba.
    // Siempre acota la altura al espacio disponible (con scroll interno).
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    let top;
    let maxHeight;
    if (menuH <= spaceBelow || spaceBelow >= spaceAbove) {
      top = rect.bottom + MENU_GAP;
      maxHeight = Math.max(140, spaceBelow);
    } else {
      maxHeight = Math.max(140, spaceAbove);
      top = Math.max(8, rect.top - Math.min(menuH, maxHeight) - MENU_GAP);
    }
    setCoords({ top, left, maxHeight });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        !buttonRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', () => setOpen(false), true);
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
    ...(onNoShow ? [{
      key: 'noshow',
      label: 'No asistió',
      icon: UserX,
      color: 'text-zinc-700 hover:bg-zinc-50',
      disabled: status === 'no_show',
      action: () => onNoShow?.(booking),
    }] : []),
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
    ...(onDelete ? [{
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      color: 'text-red-600 hover:bg-red-50',
      // La confirmación la hace deleteBooking (useBookingActions) para no duplicarla.
      action: () => onDelete?.(booking),
    }] : []),
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors ${className}`}
        aria-label="Acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: MENU_WIDTH,
            maxHeight: coords.maxHeight,
            overflowY: 'auto',
            zIndex: 200,
          }}
          className="rounded-xl border border-admin-border bg-white shadow-2xl py-1"
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
        </div>,
        document.body
      )}
    </>
  );
};

export default BookingActionMenu;
