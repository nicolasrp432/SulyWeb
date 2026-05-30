import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-rose-gold/15 text-brand-rose flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-admin-text leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-admin-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
