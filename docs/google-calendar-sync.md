# Sincronización bidireccional con Google Calendar (agenda del iPhone)

Este documento describe **cómo sincronizar la agenda que el equipo usa en el
Calendario del iPhone con las reservas de la app** (tabla `bookings` en
Supabase), en las **dos direcciones**.

> **Idea clave:** el Calendario del iPhone **no tiene API pública**. Por debajo
> sincroniza con iCloud vía CalDAV (frágil, sin webhooks). En cambio, el iPhone
> soporta de forma **nativa** las cuentas de Google: si el equipo añade un
> calendario de Google a su iPhone, lo ven y editan en la **misma app
> Calendario de siempre**, pero por debajo es Google Calendar, que **sí** tiene
> una API real con webhooks. Por eso usamos Google como "puente".

```
   iPhone (app Calendario nativa)
            │  cuenta Google añadida en Ajustes
            ▼
   Google Calendar  "Agenda Suly"   ◄──────────────┐
            │  push notifications (watch)           │  Calendar API (escribir)
            ▼                                         │
   Edge Function gcal-webhook  ──►  Supabase bookings ──►  Edge Function gcal-push
        (Google → app)                                       (app → Google)
```

---

## 1. Decisiones de diseño

### Autenticación con Google: **Service Account**
Para un único calendario compartido, lo más simple y robusto es una **cuenta de
servicio** (service account) de Google Cloud:

1. Se crea el calendario `Agenda Suly` en la cuenta Google del salón.
2. Se **comparte** ese calendario con el email de la service account dándole
   permiso **"Hacer cambios en los eventos"**.
3. La service account obtiene un *access token* firmando un JWT (RS256) — sin
   flujo OAuth interactivo ni *refresh tokens* que caduquen.

### Prevención de bucles: **hash de contenido (`sync_hash`)**
El problema clásico de toda sync bidireccional: app escribe en Google → Google
notifica → escribimos en app → app notifica a Google → bucle infinito.

Lo resolvemos guardando en cada `booking` un `sync_hash` = hash de los campos
sincronizables (fecha, hora, duración, nombre, notas, estado).

- **Push (app → Google):** calcula el hash actual del booking. Si coincide con
  `sync_hash`, **no hay nada nuevo que enviar** → se omite. Si no, envía a
  Google y guarda el nuevo `sync_hash`.
- **Webhook (Google → app):** al escribir el booking desde un evento de Google,
  guarda el `sync_hash` del contenido entrante. Así el DB-webhook que dispara
  ese cambio verá que el hash ya coincide y **no reenviará** a Google.

Resultado: cada cambio se propaga **exactamente una vez**.

### Resolución de conflictos: **última escritura gana**
Si el mismo booking se edita casi a la vez en los dos lados, gana la edición más
reciente (comparando `updated_at` del booking con `event.updated` de Google).
Suficiente para un salón; se puede refinar más adelante.

### Mapeo de eventos creados a mano en el iPhone
Los eventos que el equipo escribe en el iPhone son **texto libre** (no traen
servicio/manicurista estructurados). Al importarlos se crea un `booking` con:

| Campo booking      | Origen del evento Google                                  |
|--------------------|----------------------------------------------------------|
| `client_name`      | Título del evento (`summary`)                            |
| `booking_date`     | Fecha de inicio                                          |
| `booking_time`     | Hora de inicio                                           |
| `duration_minutes` | (fin − inicio)                                           |
| `notes`            | Descripción del evento                                   |
| `location_id`      | `DEFAULT_LOCATION_ID` (sede principal, configurable)     |
| `staff_id`         | `null` (sin asignar; se asigna luego desde el panel)     |
| `status`           | `confirmed`                                              |
| `origin`           | `calendar`  ← así se distinguen de las reservas online   |
| `sync_origin`      | `google`                                                 |

Estos bookings **ocupan el hueco** igual que cualquier cita (el chequeo de
solapes en `create_public_booking` mira todos los bookings no cancelados), por
lo que **evitan dobles reservas** desde la web. El equipo puede luego
enriquecerlos (servicio, manicurista) desde el panel admin.

---

## 2. Componentes (qué se ha añadido al repo)

| Archivo | Función |
|---------|---------|
| `supabase/migrations/20260608_google_calendar_sync.sql` | Columnas de sync en `bookings`, tabla `calendar_sync_state`, trigger/DB-webhook de salida |
| `supabase/functions/_shared/google.js` | Auth service-account (JWT→access token) + cliente Calendar API |
| `supabase/functions/_shared/mapping.js` | Conversión booking↔evento y cálculo de `sync_hash` |
| `supabase/functions/gcal-push/index.js` | **App → Google** (lo dispara el DB-webhook al cambiar `bookings`) |
| `supabase/functions/gcal-webhook/index.js` | **Google → App** (lo llama Google al cambiar un evento) |
| `supabase/functions/gcal-watch/index.js` | Crea/renueva el canal `watch` y el `syncToken` (cron diario) |

---

## 3. Puesta en marcha (paso a paso)

### 3.1. Google Cloud + calendario
1. Inicia sesión con la cuenta Google del salón (p. ej. `sulyprettynails@gmail.com`).
2. En **Google Calendar**, crea un calendario nuevo llamado **`Agenda Suly`**.
   En *Configuración del calendario* copia su **ID** (algo como
   `...@group.calendar.google.com`).
3. Ve a <https://console.cloud.google.com/> → crea un proyecto (p. ej.
   `suly-calendar-sync`).
4. **APIs y servicios → Biblioteca →** activa **Google Calendar API**.
5. **APIs y servicios → Credenciales → Crear credenciales → Cuenta de servicio**.
   Dale un nombre y créala. Entra en la cuenta de servicio → **Claves → Agregar
   clave → JSON**. Descarga el archivo (contiene `client_email` y `private_key`).
6. Vuelve a Google Calendar → *Configuración de `Agenda Suly`* → **Compartir con
   determinadas personas** → añade el `client_email` de la service account con
   permiso **"Hacer cambios en los eventos"**.

### 3.2. Secrets de Supabase
```bash
# El contenido íntegro del JSON de la cuenta de servicio (en una sola línea)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# ID del calendario "Agenda Suly"
supabase secrets set GCAL_CALENDAR_ID='xxxxx@group.calendar.google.com'

# Zona horaria del salón
supabase secrets set GCAL_TIMEZONE='Europe/Madrid'

# Sede por defecto para los eventos creados a mano en el iPhone (uuid de locations)
supabase secrets set DEFAULT_LOCATION_ID='<uuid-sede-principal>'

# Secreto compartido para proteger gcal-push / gcal-watch (inventa una cadena larga)
supabase secrets set SYNC_SHARED_SECRET='<cadena-aleatoria-larga>'

# Secreto que Google devolverá en cada notificación (valida el webhook entrante)
supabase secrets set GCAL_CHANNEL_TOKEN='<otra-cadena-aleatoria>'

# URL pública de gcal-webhook (la usa gcal-watch al crear el canal)
supabase secrets set GCAL_WEBHOOK_URL='https://qeuqspjpwybaxppqgehm.functions.supabase.co/gcal-webhook'

# (ya existentes en el proyecto)
supabase secrets set SUPABASE_URL='https://qeuqspjpwybaxppqgehm.supabase.co'
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<service_role_key>'
```

### 3.3. Migración + despliegue de funciones
```bash
supabase link --project-ref qeuqspjpwybaxppqgehm
supabase db push                       # aplica la migración nueva
supabase functions deploy gcal-push    --no-verify-jwt
supabase functions deploy gcal-webhook --no-verify-jwt
supabase functions deploy gcal-watch   --no-verify-jwt
```

### 3.4. DB-webhook de salida (app → Google)
La migración deja preparado un trigger que, en cada `INSERT/UPDATE/DELETE` de
`bookings`, llama a `gcal-push` mediante la extensión `pg_net`. Solo tienes que
fijar dos *settings* de base de datos con la URL y el secreto (una vez):

```sql
alter database postgres set "app.gcal_push_url"   = 'https://qeuqspjpwybaxppqgehm.functions.supabase.co/gcal-push';
alter database postgres set "app.sync_shared_secret" = '<cadena-aleatoria-larga>';
```
(También puede hacerse con **Database Webhooks** desde el panel de Supabase
apuntando a la función `gcal-push`; ver comentario en la migración.)

### 3.5. Activar la escucha de Google (entrada) y el cron de renovación
El canal `watch` de Google **caduca** (máx. ~7 días). Lo creamos y lo renovamos
con un cron diario que llama a `gcal-watch`:

```sql
-- requiere las extensiones pg_cron y pg_net (activables desde el panel)
select cron.schedule(
  'gcal-watch-renew', '0 3 * * *',
  $$ select net.http_post(
       url     := 'https://qeuqspjpwybaxppqgehm.functions.supabase.co/gcal-watch',
       headers := jsonb_build_object('x-sync-secret','<cadena-aleatoria-larga>')
     ); $$
);
```
Ejecuta una primera vez `gcal-watch` a mano (o espera al cron) para crear el
canal inicial y guardar el `syncToken`.

### 3.6. En el iPhone del equipo
1. **Ajustes → Calendario → Cuentas → Añadir cuenta → Google** e inicia sesión
   con la cuenta del salón (o comparte `Agenda Suly` con la cuenta Google de
   cada empleada).
2. Activa **Calendarios**. En la app Calendario aparece **`Agenda Suly`**.
3. A partir de aquí: lo que escriban ahí llega a la app, y las reservas online
   aparecen ahí. **Importante:** que creen las citas dentro del calendario
   `Agenda Suly` (no en su calendario personal de iCloud).

---

## 4. Plan por fases (recomendado)

1. **Fase A — solo lectura (días):** desplegar `gcal-push` para que las reservas
   online aparezcan en el iPhone. Cero riesgo, alivio inmediato.
2. **Fase B — entrada (Google → app):** activar `gcal-webhook` + `gcal-watch` y
   probar con citas de prueba antes de anunciarlo al equipo.
3. **Fase C — afinar mapeo:** decidir convenciones de título (p. ej.
   `Nombre - Servicio`) para enriquecer automáticamente los bookings.

---

## 5. Pruebas / verificación
- Crear una reserva online → debe aparecer en `Agenda Suly` (y en el iPhone) en
  segundos.
- Cambiar la hora desde el panel admin → el evento se mueve en Google.
- Crear un evento a mano en el iPhone dentro de `Agenda Suly` → aparece en el
  panel admin como booking `origin = calendar` y bloquea ese hueco en la web.
- Cancelar/borrar en un lado → se refleja en el otro.
- Revisar `select * from calendar_sync_state;` para el estado del `syncToken` y
  del canal, y los logs de las funciones (`supabase functions logs gcal-*`).

## 6. Limitaciones conocidas
- Los eventos a mano no traen servicio/manicurista (se asignan luego).
- Conflicto simultáneo: última escritura gana (sin *merge* por campo).
- El canal de Google debe renovarse (lo cubre el cron diario).
- Si se borra y recrea el calendario, hay que volver a ejecutar `gcal-watch`.
