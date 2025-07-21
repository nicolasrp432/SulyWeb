-- Actualización del esquema de la base de datos para soportar múltiples servicios por reserva

-- 1. Modificar la tabla de reservas para eliminar la referencia directa a un solo servicio
ALTER TABLE bookings DROP COLUMN IF EXISTS service_id;

-- 2. Crear una tabla de relación muchos a muchos entre reservas y servicios
CREATE TABLE IF NOT EXISTS booking_services (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, service_id)
);

-- 3. Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);

-- 4. Actualizar los servicios con los nuevos datos
TRUNCATE TABLE services CASCADE;

INSERT INTO services (id, name, duration, price, category) VALUES
(1, 'Manicura Semipermanente', '45 min', '18,00€', 'nails'),
(2, 'Manicura Acrílica', '90 min', '35,00€', 'nails'),
(3, 'Manicura Gel', '90 min', '35,00€', 'nails'),
(4, 'Pedicura Semipermanente', '60 min', '25,00€', 'nails'),
(5, 'Pedicura Spa', '75 min', '30,00€', 'nails'),
(6, 'Esmaltado Semipermanente', '30 min', '15,00€', 'nails'),
(7, 'Reparación de uña (por uña)', '15 min', '3,00€', 'nails'),
(8, 'Retirada de esmaltado', '15 min', '5,00€', 'nails'),
(9, 'Retirada de uñas acrílicas', '30 min', '15,00€', 'nails'),
(10, 'Retirada de uñas de gel', '30 min', '15,00€', 'nails'),
(11, 'Manicura Rusa', '60 min', '25,00€', 'nails'),
(12, 'Manicura Spa', '60 min', '25,00€', 'nails'),
(13, 'Manicura Express', '30 min', '12,00€', 'nails'),
(14, 'Pedicura Express', '30 min', '15,00€', 'nails'),
(15, 'Lifting de Pestañas', '60 min', '35,00€', 'beauty'),
(16, 'Tinte de Pestañas', '30 min', '15,00€', 'beauty'),
(17, 'Depilar cejas', '15 min', '5,00€', 'beauty'),
(18, 'Depilar bigote', '10 min', '5,00€', 'beauty'),
(19, 'Depilar axila', '15 min', '9,90€', 'beauty'),
(20, 'Depilar rostro entero', '30 min', '14,90€', 'beauty');