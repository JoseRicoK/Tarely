# Sistema de Confirmación de Email con Resend

Este proyecto utiliza Resend para enviar correos de confirmación cuando los usuarios se registran.

## Configuración

### 1. Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=tu_api_key_de_resend

# URL de tu aplicación (importante para los enlaces de confirmación)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # En desarrollo
# NEXT_PUBLIC_APP_URL=https://tudominio.com  # En producción
```

### 2. Configuración de Resend

1. Crea una cuenta en [Resend](https://resend.com)
2. Verifica tu dominio en Resend (o usa el dominio de prueba `onboarding@resend.dev`)
3. Obtén tu API Key desde el dashboard
4. Actualiza el remitente en `src/lib/email.ts`:

```typescript
// Cambiar de:
const FROM_EMAIL = 'TareAI <onboarding@resend.dev>';

// A tu dominio verificado:
const FROM_EMAIL = 'TareAI <noreply@tudominio.com>';
```

### 3. Base de Datos

Ejecuta el script SQL para agregar las columnas necesarias a la tabla `profiles`:

```bash
# Conecta a tu base de datos Supabase y ejecuta:
scripts/email-confirmation-schema.sql
```

O ejecuta directamente en el SQL Editor de Supabase:

```sql
-- Añadir campos de confirmación de email
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS confirmation_token TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS confirmation_token_expires TIMESTAMPTZ;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_confirmation_token 
ON profiles(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- Marcar usuarios existentes como confirmados
UPDATE profiles 
SET email_confirmed = true 
WHERE email_confirmed IS NULL OR email_confirmed = false;
```

### 4. Subir el Logo a Supabase Storage

El template de email utiliza el logo desde Supabase Storage. Sigue estos pasos:

1. Ve a Supabase Dashboard → Storage
2. Crea un bucket público llamado `assets` (si no existe)
3. Sube el archivo `public/logo/logo_tarely_bg.png` al bucket
4. Asegúrate de que la URL en `src/lib/email-templates.ts` sea correcta:

```typescript
// Debe coincidir con tu URL de Supabase
https://uctozgraqjrtjldgzqgd.supabase.co/storage/v1/object/public/assets/logo_tarely_bg.png
```

## Flujo del Sistema

1. **Registro**: Usuario se registra en `/registro`
2. **Email enviado**: Se envía un correo con un enlace de confirmación
3. **Confirmación**: Usuario hace clic en el enlace
4. **Validación**: El sistema valida el token
5. **Bienvenida**: Se envía un correo de bienvenida
6. **Login**: Usuario puede iniciar sesión

## Rutas Creadas

- `POST /api/auth/registro` - Crea usuario y envía correo de confirmación
- `GET /api/auth/confirm` - Confirma el email del usuario
- `POST /api/auth/resend-confirmation` - Reenvía el correo de confirmación
- `/auth/check-email` - Página que indica revisar el correo
- `/auth/confirm-success` - Página de confirmación exitosa
- `/auth/confirm-error` - Página de error en la confirmación

## Personalización de Templates

Los templates de email están en `src/lib/email-templates.ts`. Puedes personalizarlos:

- **Colores**: Cambia los gradientes y colores del tema
- **Logo**: Actualiza la URL del logo
- **Contenido**: Modifica los textos y mensajes
- **Estilos**: Ajusta el diseño HTML/CSS inline

## Testing en Desarrollo

Para probar el sistema en desarrollo:

1. Asegúrate de tener Resend configurado
2. Ejecuta el servidor: `npm run dev`
3. Regístrate con un email real
4. Revisa el correo (o los logs de Resend Dashboard)
5. Haz clic en el enlace de confirmación

## Seguridad

- Los tokens expiran en 24 horas
- No se revela si un email existe en la base de datos
- Los tokens son únicos y aleatorios (32 bytes)
- No se permite login sin confirmación de email

## Troubleshooting

### No llegan los correos

1. Verifica tu API Key de Resend
2. Revisa los logs del servidor para errores
3. Confirma que el dominio esté verificado en Resend
4. Revisa la carpeta de spam

### Error "Token inválido"

- El token puede haber expirado (24 horas)
- El token ya fue usado
- Solicita un nuevo correo de confirmación

### Logo no se muestra

- Verifica que el bucket `assets` sea público
- Confirma que la URL del logo sea correcta
- Sube el logo manualmente a Supabase Storage
