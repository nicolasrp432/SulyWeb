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
      className="bg-white border border-admin-border rounded-2xl p-4 sm:p-5 shadow-rose-xs hover:shadow-rose-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-admin-muted uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 rounded-lg bg-admin-surface animate-pulse mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-admin-text">{value}</p>
          )}
          {hint && !loading && (
            <p className="text-[10px] text-admin-muted mt-1 truncate">{hint}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
