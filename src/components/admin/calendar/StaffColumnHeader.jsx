import React from 'react';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
};

const StaffColumnHeader = ({ staff, bookingCount = 0, isUnassigned = false }) => {
  const name = staff?.full_name || staff?.name || (isUnassigned ? 'Sin asignar' : '—');
  const avatarUrl = staff?.avatar_url;

  return (
    <div className="px-2 py-2.5 flex flex-col items-center gap-1.5 border-l border-admin-border bg-white">
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-rose-sm shrink-0 overflow-hidden ${
        isUnassigned
          ? 'bg-gradient-to-br from-zinc-300 to-zinc-400'
          : 'bg-gradient-rose-gold'
      }`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span>{isUnassigned ? '?' : getInitials(name)}</span>
        )}
      </div>
      <p className="text-[11px] font-bold text-admin-text text-center leading-tight truncate max-w-full">
        {name}
      </p>
      <p className="text-[9px] text-admin-muted uppercase tracking-wider font-semibold">
        {bookingCount} {bookingCount === 1 ? 'cita' : 'citas'}
      </p>
    </div>
  );
};

export default StaffColumnHeader;
