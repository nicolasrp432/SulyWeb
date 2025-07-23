import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VALIDATION } from '@/constants';

// Esquemas de validación con Zod
export const bookingSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH, `El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
    .max(VALIDATION.NAME_MAX_LENGTH, `El nombre no puede exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Por favor, introduce un email válido')
    .regex(VALIDATION.EMAIL_REGEX, 'Formato de email inválido'),
  
  phone: z
    .string()
    .min(9, 'El teléfono debe tener al menos 9 dígitos')
    .regex(VALIDATION.PHONE_REGEX, 'Formato de teléfono inválido'),
  
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
  
  location: z
    .string()
    .min(1, 'Por favor, selecciona una sede'),
  
  services: z
    .array(z.string())
    .min(1, 'Por favor, selecciona al menos un servicio'),
  
  date: z
    .string()
    .min(1, 'Por favor, selecciona una fecha'),
  
  time: z
    .string()
    .min(1, 'Por favor, selecciona una hora')
});

export const contactSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH, `El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
    .max(VALIDATION.NAME_MAX_LENGTH, `El nombre no puede exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Por favor, introduce un email válido')
    .regex(VALIDATION.EMAIL_REGEX, 'Formato de email inválido'),
  
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Campo opcional
      return VALIDATION.PHONE_REGEX.test(val);
    }, 'Formato de teléfono inválido (mínimo 9 dígitos)'),
  
  message: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres')
});

/**
 * Hook personalizado para validación de formularios
 * @param {Object} schema - Esquema de validación Zod
 * @param {Object} defaultValues - Valores por defecto del formulario
 * @returns {Object} - Objeto con métodos y estado del formulario
 */
export const useFormValidation = (schema, defaultValues = {}) => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange' // Validación en tiempo real
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
    reset,
    setValue,
    getValues,
    watch,
    clearErrors,
    setError
  } = form;

  // Función helper para obtener el mensaje de error de un campo
  const getFieldError = (fieldName) => {
    return errors[fieldName]?.message;
  };

  // Función helper para verificar si un campo tiene error
  const hasFieldError = (fieldName) => {
    return !!errors[fieldName];
  };

  // Función helper para limpiar errores de un campo específico
  const clearFieldError = (fieldName) => {
    clearErrors(fieldName);
  };

  // Función helper para establecer un error personalizado
  const setFieldError = (fieldName, message) => {
    setError(fieldName, {
      type: 'manual',
      message
    });
  };

  return {
    register,
    handleSubmit,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    reset,
    setValue,
    getValues,
    watch,
    getFieldError,
    hasFieldError,
    clearFieldError,
    setFieldError,
    form // Objeto completo del formulario para casos avanzados
  };
};

/**
 * Hook específico para el formulario de reservas
 */
export const useBookingForm = (defaultValues) => {
  return useFormValidation(bookingSchema, defaultValues);
};

/**
 * Hook específico para el formulario de contacto
 */
export const useContactForm = (defaultValues) => {
  return useFormValidation(contactSchema, defaultValues);
};