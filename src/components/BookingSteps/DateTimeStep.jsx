import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Loader2 } from 'lucide-react';

const DateTimeStep = memo(({ 
  availableDates, 
  timeSlots, 
  selectedDate, 
  selectedTime, 
  blockedSlots, 
  loading, 
  onDateSelect, 
  onTimeSelect 
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-pink-500" />
          Selecciona una Fecha
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
          {availableDates.map((d) => (
            <motion.button 
              key={d.date} 
              whileHover={{ scale: 1.02 }} 
              onClick={() => onDateSelect(d.date)} 
              className={`p-3 rounded-lg text-left transition-all duration-300 ${
                selectedDate === d.date 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                  : 'bg-white border'
              }`}
            >
              <div className="text-sm font-medium capitalize">{d.display}</div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-pink-500" />
            Selecciona una Hora
          </h3>
          {loading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {timeSlots.map((time) => {
                const isBlocked = blockedSlots.includes(time);
                return (
                  <motion.button 
                    key={time} 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => !isBlocked && onTimeSelect(time)} 
                    disabled={isBlocked} 
                    className={`p-3 rounded-lg font-medium transition-all duration-300 ${
                      isBlocked 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : selectedTime === time 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                          : 'bg-white border'
                    }`}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DateTimeStep.displayName = 'DateTimeStep';

export default DateTimeStep;