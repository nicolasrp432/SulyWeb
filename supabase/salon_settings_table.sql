-- Tabla para la configuración global de la agenda y salón
CREATE TABLE IF NOT EXISTS salon_settings (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Usamos ID 1 para configuración global única
  max_advance_days INTEGER DEFAULT 30,
  excluded_days INTEGER[] DEFAULT ARRAY[0], -- 0 = Domingo, por defecto excluido
  time_slots TEXT[] DEFAULT ARRAY[
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial por defecto
INSERT INTO salon_settings (id, max_advance_days, excluded_days, time_slots)
VALUES (
  1, 
  30, 
  ARRAY[0], 
  ARRAY[
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ]
)
ON CONFLICT (id) DO NOTHING;
