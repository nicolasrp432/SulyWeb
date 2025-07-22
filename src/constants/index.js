// URLs y endpoints
export const ROUTES = {
  HOME: '/',
  SERVICES: '/servicios',
  BOOKING: '/reservas',
  ABOUT: '/nosotras',
  CONTACT: '/contacto',
  GALLERY: '/galeria'
};

// Mensajes de la aplicación
export const MESSAGES = {
  ERRORS: {
    GENERIC: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
    BOOKING_UNAVAILABLE: 'El horario seleccionado ya no está disponible. Por favor, elige otro.',
    FORM_VALIDATION: 'Por favor, completa todos los campos requeridos.',
    LOAD_LOCATIONS: 'No se pudieron cargar las sedes.',
    LOAD_SERVICES: 'No se pudieron cargar los servicios.',
    VERIFY_SLOTS: 'No se pudieron verificar los horarios.'
  },
  SUCCESS: {
    BOOKING_CONFIRMED: 'Reserva confirmada',
    SERVICE_ADDED: 'Servicio añadido a tu reserva',
    SERVICE_REMOVED: 'Servicio eliminado de tu reserva',
    CART_CLEARED: 'Carrito vaciado'
  },
  INFO: {
    BOOKING_DESCRIPTION: 'Gracias {name}, hemos recibido tu solicitud. Te contactaremos pronto.',
    BOOKING_PARTIAL: 'Tu reserva se ha creado pero algunos servicios no pudieron ser añadidos.',
    WHATSAPP_CONFIRMATION: 'Tu solicitud de reserva ha sido enviada. Recibirás una confirmación por WhatsApp en breve. ¡Gracias por confiar en nosotras!'
  }
};

// Configuraciones de la aplicación
export const CONFIG = {
  BOOKING: {
    MAX_ADVANCE_DAYS: 30,
    EXCLUDED_DAYS: [0], // Domingo
    TIME_SLOTS: [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00'
    ],
    STEPS: {
      LOCATION: 1,
      SERVICES: 2,
      DATETIME: 3,
      PERSONAL_DATA: 4,
      CONFIRMATION: 5
    }
  },
  TOAST: {
    DEFAULT_DURATION: 3000,
    SUCCESS_DURATION: 5000,
    ERROR_DURATION: 7000
  },
  STORAGE_KEYS: {
    BOOKING_CART: 'booking_cart_services',
    USER_PREFERENCES: 'user_preferences'
  },
  ANIMATION: {
    PAGE_TRANSITION: { duration: 0.5 },
    CARD_HOVER: { scale: 1.02 },
    BUTTON_HOVER: { scale: 1.05 }
  }
};

// Información de contacto
export const CONTACT_INFO = {
  PHONE: '+34 123 456 789',
  WHATSAPP: '+34 123 456 789',
  EMAIL: 'sulyprettynails@gmail.com',
  LOCATIONS: {
    BASAURI: {
      name: 'Basauri',
      address: 'Calle Principal 123, Basauri',
      phone: '+34 123 456 789'
    },
    GALDAKAO: {
      name: 'Galdakao',
      address: 'Avenida Central 456, Galdakao',
      phone: '+34 987 654 321'
    }
  }
};

// Validaciones
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[0-9\s-()]{9,}$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
};

// Temas y estilos
export const THEME = {
  COLORS: {
    PRIMARY: 'from-pink-500 to-rose-500',
    SECONDARY: 'from-purple-500 to-indigo-500',
    SUCCESS: 'text-green-500',
    ERROR: 'text-red-500',
    WARNING: 'text-yellow-500'
  },
  GRADIENTS: {
    PRIMARY: 'bg-gradient-to-r from-pink-500 to-rose-500',
    SECONDARY: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    BACKGROUND: 'bg-gradient-to-br from-pink-50 to-rose-100'
  }
};