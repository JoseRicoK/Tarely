# 🗓️ Configuración de Google Calendar

Esta guía te ayudará a configurar la integración de Google Calendar en Tarely.

## 📋 Requisitos previos

- Cuenta de Google
- Acceso a Google Cloud Console
- Base de datos Supabase configurada

## 🚀 Pasos de configuración

### 1. Ejecutar el script SQL de base de datos

Ejecuta el script SQL para crear las tablas necesarias:

```bash
# Desde la consola de Supabase o usando el CLI
psql -h your_supabase_host -U postgres -d postgres -f scripts/google-calendar-schema.sql
```

O copia y pega el contenido de `scripts/google-calendar-schema.sql` en el SQL Editor de Supabase.

### 2. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 3. Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es tu primera vez, configura la pantalla de consentimiento:
   - User Type: External (para desarrollo) o Internal (si tienes Google Workspace)
   - App name: Tarely
   - User support email: tu email
   - Developer contact: tu email
   - Scopes: No es necesario añadir ninguno en este paso
   - Test users: Añade tu email (para modo desarrollo)

4. Crea el OAuth client ID:
   - Application type: Web application
   - Name: Tarely - Google Calendar Integration
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://tu-dominio.com (para producción)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/google-calendar/callback
     https://tu-dominio.com/api/google-calendar/callback (para producción)
     ```

5. Copia el **Client ID** y **Client Secret**

### 4. Configurar variables de entorno

Añade las credenciales a tu archivo `.env.local`:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### 5. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## 🎯 Características

### Para usuarios

- **Conectar Google Calendar**: Los usuarios pueden conectar su cuenta de Google desde la configuración del calendario
- **Ver bloques ocupados**: El calendario muestra automáticamente los bloques ocupados de Google Calendar (sin mostrar detalles privados)
- **Sincronización automática**: Las tareas con fecha se sincronizan automáticamente con Google Calendar
- **Detección de conflictos**: Aviso visual cuando intentas programar una tarea en un horario ocupado
- **Sincronización bidireccional**: 
  - Crear tarea con fecha → Se crea evento en Google Calendar
  - Actualizar fecha de tarea → Se actualiza evento en Google Calendar
  - Eliminar fecha de tarea → Se elimina evento de Google Calendar

### Permisos solicitados

La aplicación solicita los siguientes permisos mínimos:

- `https://www.googleapis.com/auth/calendar.events` - Para crear/actualizar/eliminar eventos
- `https://www.googleapis.com/auth/calendar.freebusy` - Para ver bloques ocupados sin detalles

## 🔒 Seguridad y privacidad

- Los tokens de acceso se almacenan de forma segura en Supabase con Row Level Security (RLS)
- Solo se comparte información de disponibilidad (busy/free), no detalles de eventos
- Los usuarios pueden desconectar Google Calendar en cualquier momento
- Los refresh tokens permiten mantener la conexión sin reautenticación constante

## 🛠️ Solución de problemas

### Error: "Google Calendar not connected"

- Verifica que el usuario haya conectado su cuenta de Google
- Revisa que los tokens no hayan expirado en la tabla `google_calendar_tokens`

### Error: "Invalid tokens received from Google"

- Verifica que las redirect URIs estén correctamente configuradas en Google Cloud Console
- Asegúrate de que el Client ID y Client Secret sean correctos

### Error: "Failed to fetch free/busy data"

- Verifica que la Google Calendar API esté habilitada en tu proyecto
- Revisa que los scopes solicitados sean correctos

### Los eventos no se sincronizan

- Verifica que la tarea tenga una fecha asignada
- Revisa la consola del navegador y los logs del servidor para errores
- Asegúrate de que el token de acceso no haya expirado

## 📊 Tablas de base de datos

### `google_calendar_tokens`

Almacena los tokens OAuth de los usuarios:

- `id`: UUID del registro
- `user_id`: ID del usuario (FK a profiles)
- `access_token`: Token de acceso de Google (se refresca automáticamente)
- `refresh_token`: Token de refresco (permanente hasta que se revoque)
- `token_expiry`: Fecha de expiración del access_token
- `scope`: Scopes autorizados
- `created_at`, `updated_at`: Timestamps

### `task_google_calendar_sync`

Mapea tareas de Tarely con eventos de Google Calendar:

- `id`: UUID del registro
- `task_id`: ID de la tarea (FK a tasks)
- `user_id`: ID del usuario (FK a profiles)
- `google_event_id`: ID del evento en Google Calendar
- `google_calendar_id`: ID del calendario (por defecto 'primary')
- `last_synced_at`: Última vez que se sincronizó
- `created_at`, `updated_at`: Timestamps

## 🔄 Flujo de autenticación

1. Usuario hace clic en "Conectar Google Calendar"
2. Se genera URL de autorización OAuth → `/api/google-calendar/auth`
3. Usuario es redirigido a Google para dar permisos
4. Google redirige de vuelta a → `/api/google-calendar/callback?code=...`
5. Se intercambia el código por tokens (access_token + refresh_token)
6. Los tokens se guardan en la base de datos
7. Usuario es redirigido de vuelta a la app con mensaje de éxito

## 🎨 Uso del componente FullCalendar

El calendario utiliza FullCalendar con las siguientes vistas:

- **Mes (dayGridMonth)**: Vista mensual completa
- **Semana (timeGridWeek)**: Vista semanal con horarios
- **Día (timeGridDay)**: Vista diaria detallada
- **Lista (listWeek)**: Vista de lista de eventos

## 📝 Próximas mejoras

- [ ] Sincronización de cambios desde Google Calendar hacia Tarely
- [ ] Soporte para múltiples calendarios
- [ ] Recordatorios sincronizados
- [ ] Colores de eventos sincronizados
- [ ] Invitados y asistentes
