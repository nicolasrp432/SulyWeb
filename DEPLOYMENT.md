# Deployment & Administración — Suly Pretty Nails

Guía operativa para desplegar el sitio en Vercel y gestionar las cuentas del equipo administrador.

---

## 1. Deploy en Vercel

El sitio se despliega automáticamente en Vercel en cada push a la rama `main` del repo.

### Variables de entorno obligatorias

En **Vercel → Project Settings → Environment Variables** debe haber:

| Nombre | Valor | Ámbito |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (ej. `https://qeuqspjpwybaxppqgehm.supabase.co`) | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Clave **anon/publishable** del proyecto Supabase | Production, Preview, Development |

> Tras cambiar variables: **Redeploy** desde el dashboard de Vercel.

### Routing SPA — `vercel.json`

El archivo [vercel.json](vercel.json) configura el rewrite que hace que cualquier ruta no encontrada (por ejemplo `/admin`, `/admin/calendario`) sirva `index.html`. Sin esto, Vercel devuelve `404 NOT_FOUND` al acceder directamente a rutas distintas de `/`.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Si vuelves a ver el error `404 NOT_FOUND` al entrar a `/admin`, verifica que este archivo siga en la raíz y que el último deploy lo haya incluido.

---

## 2. Setup inicial de Supabase (una sola vez)

### 2.1 Aplicar la migración `admin_profiles`

1. Abre **Supabase Dashboard → SQL Editor → New query**.
2. Copia el contenido de [supabase/migrations/20260601_admin_profiles.sql](supabase/migrations/20260601_admin_profiles.sql).
3. Ejecútalo (botón "Run"). Crea la tabla `admin_profiles`, las RLS y las funciones helper.

### 2.2 Crear el primer OWNER

1. Ve a **Supabase Dashboard → Authentication → Users → Add user (manual)**.
2. Introduce tu email + contraseña fuerte. **Marca** la opción *"Auto Confirm User"*.
3. Tras crearlo, copia el **UUID** del nuevo user (columna `id`).
4. Vuelve al **SQL Editor** y ejecuta:

   ```sql
   INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
   VALUES ('<UUID_QUE_COPIASTE>', '<tu_email>', 'Tu nombre completo', 'owner', true);
   ```

5. Ya puedes entrar a `https://<tu-dominio>/admin/login` con esos credenciales.

---

## 3. Añadir nuevos admins a tu equipo

Una vez tienes el owner inicial, **no necesitas tocar SQL** para añadir más admins.

### Paso 1 — Crear el usuario en Supabase Auth (lo haces tú, el owner)

1. **Supabase Dashboard → Authentication → Users → Add user (manual)**.
2. Introduce el email del compañero y una contraseña inicial (compártela con él por canal seguro).
3. Marca *"Auto Confirm User"*.

> Esto evita registro público y deja el control de las cuentas en tus manos. Tu equipo no puede registrarse solo.

### Paso 2 — Activar acceso desde la UI

1. Login en `/admin/login` (como owner).
2. Ve a `/admin/configuracion` → sección **"Equipo administrador"** (solo visible si eres owner).
3. En el formulario "Activar nuevo admin":
   - Introduce el email del nuevo compañero.
   - Opcionalmente su nombre completo.
   - Selecciona rol: **Admin** (acceso normal) u **Owner** (también puede gestionar el equipo).
4. Click **"Activar acceso"**.

Si todo OK, el compañero ya puede entrar a `/admin/login` con su email y contraseña. Verá el panel.

### Casos comunes

- **"Este email no existe en Supabase Auth"** → te saltaste el Paso 1. Crea primero la cuenta en Auth.
- **"Este usuario ya tiene perfil admin"** → si está desactivado, reactívalo desde la lista (Switch).
- **Cambiar contraseña de un admin** → desde Supabase Dashboard → Authentication → Users → click en el user → *"Send password recovery"* o reset manual.

### Desactivar / eliminar un admin

- **Desactivar**: en la lista de equipo, toca el **Switch** del usuario. Pierde acceso al instante (al recargar verá "Acceso no autorizado"). Su cuenta en Supabase Auth sigue existiendo.
- **Eliminar**: icono de papelera (junto al switch). Borra solo el perfil admin; la cuenta en Auth permanece. Si quieres borrarla del todo, hazlo después en Supabase Dashboard → Authentication → Users.
- No puedes desactivarte ni eliminarte a ti mismo desde la UI (medida de seguridad).

---

## 4. Sistema de notificaciones

Cuando un cliente reserva online (web pública o WhatsApp), todos los admins conectados ven la notificación en tiempo real:

- **Badge en la campana** del topbar incrementa.
- **Click en la campana** → panel desplegable con la lista de citas nuevas.
- **Click en una notificación** → navega al calendario en el día de la cita.
- **"Marcar todas como leídas"** vacía el contador.

Las citas creadas manualmente desde el panel admin (botón "Nueva cita") **no** disparan notificación — el filtro solo notifica orígenes `online` y `whatsapp`.

Las notificaciones viven solo en la sesión del navegador (no se persisten); al recargar la página se reinician.

---

## 5. Troubleshooting

| Síntoma | Solución |
|---|---|
| `404 NOT_FOUND` al entrar a `/admin` en producción | Verifica que [vercel.json](vercel.json) está en la raíz y se incluyó en el último deploy. |
| Login OK pero pantalla "Acceso no autorizado" | Falta crear el perfil en `admin_profiles`. Sigue el procedimiento de la sección 3. |
| El badge de notificaciones no incrementa | Comprueba que tienes realtime habilitado en Supabase: **Database → Replication → bookings** debe estar en ON. |
| Errores `Invalid API key` en consola | Falta `VITE_SUPABASE_ANON_KEY` o `VITE_SUPABASE_URL` en Vercel. Redeploy tras añadirlas. |
| Owner ve "Equipo administrador" pero no admin normal | Comportamiento correcto: la sección solo aparece para owners. |
| RPC `find_user_id_by_email` no encontrada | Aplica la migración del paso 2.1 (no se aplicó). |

---

## 6. Stack y referencias rápidas

- **Hosting**: Vercel
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Frontend**: Vite + React + React Router + Tailwind + Framer Motion
- **Notificaciones email**: Edge Function `send-booking-confirmation` (ya desplegada)

Páginas admin disponibles:

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard con stats + agenda de hoy |
| `/admin/calendario` | Calendario con vista día/mes y drag/resize |
| `/admin/citas` | Listado completo de citas con filtros |
| `/admin/clientes` | Base de clientes con historial |
| `/admin/servicios` | CRUD de servicios (sincronizado a la web pública en realtime) |
| `/admin/galeria` | Subir/gestionar imágenes (sincronizado a la web pública en realtime) |
| `/admin/configuracion` | Sedes, bloqueos y equipo admin |
