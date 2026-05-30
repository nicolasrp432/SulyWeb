import React, { useEffect, useState } from 'react';

const NowIndicator = ({ hourStart = 8, hourEnd = 20, slotHeight = 64 }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMin = hourStart * 60;
  const endMin = hourEnd * 60 + 60;

  if (minutes < startMin || minutes > endMin) return null;

  const top = ((minutes - startMin) / 60) * slotHeight;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top }}
      aria-label="Hora actual"
    >
      <div className="relative h-0.5 bg-rose-500/90">
        <span className="absolute -left-1.5 -top-[5px] w-3 h-3 rounded-full bg-rose-500 shadow-rose-sm ring-2 ring-white" />
      </div>
    </div>
  );
};

export default NowIndicator;
