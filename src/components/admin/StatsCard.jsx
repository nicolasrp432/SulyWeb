import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  rose:    { bg: 'bg-brand-rose/10',    icon: 'text-brand-rose',   ring: 'ring-brand-rose/20'   },
  amber:   { bg: 'bg-amber-500/10',     icon: 'text-amber-400',    ring: 'ring-amber-500/20'    },
  emerald: { bg: 'bg-emerald-500/10',   icon: 'text-emerald-400',  ring: 'ring-emerald-500/20'  },
  blue:    { bg: 'bg-blue-500/10',      icon: 'text-blue-400',     ring: 'ring-blue-500/20'     },
};

const StatsCard = ({ title, value, icon: Icon, color = 'rose', loading }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.rose;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-admin-sidebar border border-admin-surface rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-admin-muted uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 rounded-lg bg-admin-surface animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-admin-text">{value}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
