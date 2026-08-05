import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  rose:    { bg: 'bg-brand-rose-50',   icon: 'text-brand-rose'   },
  amber:   { bg: 'bg-amber-50',        icon: 'text-amber-600'    },
  emerald: { bg: 'bg-emerald-50',      icon: 'text-emerald-600'  },
  blue:    { bg: 'bg-blue-50',         icon: 'text-blue-600'     },
};

const StatsCard = ({ title, value, icon: Icon, color = 'rose', loading, hint }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.rose;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="min-w-0 bg-white border border-admin-border rounded-2xl p-4 sm:p-5 shadow-rose-xs hover:shadow-rose-sm transition-shadow"
    >
      {/* El título ocupa toda la anchura de la tarjeta: en pantallas estrechas
          una palabra larga como "COMPLETADAS" no cabe junto al icono y se salía
          de la tarjeta. El valor y el icono van debajo, en la misma línea. */}
      <p className="text-[10px] sm:text-xs font-bold text-admin-muted uppercase tracking-wide break-words">
        {title}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2 min-w-0">
        <div className="min-w-0">
          {loading ? (
            <div className="h-8 w-16 rounded-lg bg-admin-surface animate-pulse" />
          ) : (
            <p className="text-2xl sm:text-3xl font-sans font-bold text-admin-text leading-none">{value}</p>
          )}
          {hint && !loading && (
            <p className="text-[10px] text-admin-muted mt-1 truncate">{hint}</p>
          )}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
