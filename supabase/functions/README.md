# Funciones Edge de Supabase para Suly Pretty Nails

Este directorio contiene las funciones Edge de Supabase utilizadas en la aplicación Suly Pretty Nails.

## Función: send-booking-confirmation

Esta función se encarga de enviar correos electrónicos de confirmación cuando un cliente realiza una reserva.

### Configuración

Para que la función funcione correctamente, necesitas configurar las siguientes variables de entorno en tu proyecto de Supabase:

```bash
supabase secrets set SMTP_HOST=smtp.tuproveedor.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=tu_usuario@email.com
supabase secrets set SMTP_PASSWORD=tu_contraseña
supabase secrets set FROM_EMAIL=noreply@sulyprettynails.com
supabase secrets set SUPABASE_URL=https://qeuqspjpwybaxppqgehm.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Despliegue

Para desplegar la función, utiliza el CLI de Supabase:

```bash
# Instalar CLI de Supabase si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular proyecto
supabase link --project-ref qeuqspjpwybaxppqgehm

# Desplegar función
supabase functions deploy send-booking-confirmation --no-verify-jwt
```

### Uso

La función espera recibir un objeto JSON con la siguiente estructura:

```json
{
  "to": "cliente@email.com",
  "subject": "Confirmación de Reserva - Suly Pretty Nails",
  "booking": {
    "name": "Nombre del Cliente",
    "date": "2023-12-31",
    "time": "10:00",
    "location": "Basauri",
    "services": [
      { "name": "Manicura Semipermanente", "price": "18,00€" },
      { "name": "Pedicura Express", "price": "15,00€" }
    ],
    "phone": "600123456",
    "email": "cliente@email.com",
    "notes": "Notas adicionales"
  }
}
```

## Alternativa: Servicio de Correo Externo

Si prefieres no utilizar funciones Edge de Supabase, puedes integrar un servicio de correo externo como:

1. **SendGrid**: Ofrece una API sencilla y un plan gratuito para enviar hasta 100 correos diarios.
2. **Mailgun**: Similar a SendGrid, con un plan gratuito limitado.
3. **EmailJS**: Permite enviar correos directamente desde el frontend sin necesidad de backend.

### Configuración con EmailJS (alternativa frontend)

1. Regístrate en [EmailJS](https://www.emailjs.com/)
2. Configura un servicio de correo y una plantilla
3. Instala la librería:

```bash
npm install @emailjs/browser
```

4. Implementa el envío de correo en tu código:

```javascript
import emailjs from '@emailjs/browser';

// Inicializar con tu clave pública
emailjs.init("tu_clave_publica");

// Enviar correo
emailjs.send(
  "service_id",
  "template_id",
  {
    to_email: bookingData.email,
    to_name: bookingData.name,
    booking_date: bookingData.date,
    booking_time: bookingData.time,
    // Otros datos necesarios
  }
);
```

Esta alternativa puede ser más sencilla de implementar si tienes problemas con las funciones Edge de Supabase.