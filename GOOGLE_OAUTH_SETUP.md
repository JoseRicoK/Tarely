# Configuración de Google OAuth en Tarely

Esta guía te ayudará a configurar Google OAuth en tu proyecto Tarely para permitir que los usuarios inicien sesión con sus cuentas de Google.

## 📋 Requisitos Previos

- Proyecto de Supabase creado
- Acceso a [Google Cloud Console](https://console.cloud.google.com)
- Variables de entorno de Supabase configuradas en tu `.env.local`

## 🔧 Paso 1: Configurar Google Cloud Console

### 1.1 Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Asegúrate de que el proyecto esté seleccionado en el menú superior

### 1.2 Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google+ API"
3. Haz clic en **Enable** (Habilitar)

### 1.3 Configurar la Pantalla de Consentimiento OAuth

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** como tipo de usuario
3. Completa el formulario:
   - **App name**: Tarely
   - **User support email**: tu@email.com
   - **App logo**: (opcional) sube el logo de Tarely
   - **App domain**: 
     - Homepage: `https://tarely.com` (o tu dominio)
   - **Authorized domains**: Añade tu dominio (ej: `tarely.com`)
   - **Developer contact information**: tu@email.com
4. Haz clic en **Save and Continue**

5. En **Scopes**:
   - Haz clic en **Add or Remove Scopes**
   - Selecciona:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Haz clic en **Update** y luego **Save and Continue**

6. En **Test users** (si tu app está en modo Testing):
   - Añade los emails de los usuarios que quieres que puedan probar
   - Haz clic en **Save and Continue**

7. Revisa y haz clic en **Back to Dashboard**

### 1.4 Crear Credenciales OAuth

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth Client ID**
3. Selecciona **Web application** como tipo
4. Configura:
   - **Name**: Tarely Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (para desarrollo)
     - `https://tu-dominio.com` (para producción)
   - **Authorized redirect URIs**: 
     - `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`
     - Ejemplo: `https://xyzcompany.supabase.co/auth/v1/callback`
5. Haz clic en **Create**

6. **¡IMPORTANTE!** Copia y guarda:
   - **Client ID**
   - **Client Secret**

## 🗄️ Paso 2: Configurar Supabase

### 2.1 Añadir Google como Provider

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, ve a **Authentication** > **Providers**
3. Busca **Google** en la lista
4. Activa el toggle **Enable Sign in with Google**
5. Pega tus credenciales:
   - **Client ID**: (el que copiaste de Google Cloud Console)
   - **Client Secret**: (el que copiaste de Google Cloud Console)
6. Haz clic en **Save**

### 2.2 Obtener la URL de Callback de Supabase

La URL de callback tiene el formato:
```
https://[TU-PROJECT-REF].supabase.co/auth/v1/callback
```

Puedes encontrar tu `PROJECT-REF` en:
- **Settings** > **General** > **Reference ID**

**Ejemplo**: Si tu Reference ID es `xyzcompany`, tu URL será:
```
https://xyzcompany.supabase.co/auth/v1/callback
```

### 2.3 Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[TU-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para producción, cambia `NEXT_PUBLIC_APP_URL` a tu dominio real.

## 🚀 Paso 3: Configurar URLs de Redirección en la App

### 3.1 Desarrollo Local

La URL de callback en tu aplicación ya está configurada en:
- **Archivo**: `src/app/auth/callback/route.ts`
- **Ruta**: `/auth/callback`

El flujo es:
1. Usuario hace clic en "Continuar con Google"
2. Google autentica al usuario
3. Google redirige a: `https://[PROJECT].supabase.co/auth/v1/callback`
4. Supabase procesa la autenticación
5. Supabase redirige a: `http://localhost:3000/auth/callback`
6. Tu aplicación procesa el callback y redirige a `/app`

### 3.2 Producción

Cuando despliegues a producción:

1. Actualiza la variable de entorno:
   ```env
   NEXT_PUBLIC_APP_URL=https://tarely.com
   ```

2. Añade tu dominio de producción en Google Cloud Console:
   - **Authorized JavaScript origins**: `https://tarely.com`
   - **Authorized redirect URIs**: `https://[PROJECT].supabase.co/auth/v1/callback`

## ✅ Paso 4: Probar la Integración

### 4.1 Inicio de Sesión

1. Inicia tu aplicación: `npm run dev`
2. Ve a `/login`
3. Haz clic en "Continuar con Google"
4. Deberías ser redirigido a Google para autenticarte
5. Después de autenticarte, deberías volver a `/app`

### 4.2 Registro

1. Ve a `/registro`
2. Haz clic en "Registrarse con Google"
3. El flujo es el mismo que el inicio de sesión

### 4.3 Vincular Cuenta Existente

1. Inicia sesión con email/password
2. Ve a `/perfil`
3. En la sección "Vinculación con Google", haz clic en "Vincular cuenta de Google"
4. Completa la autenticación con Google
5. Ahora podrás iniciar sesión con Google o con tu email/password

## 🔍 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URL de redirección no coincide con las configuradas en Google Cloud Console.

**Solución**: 
1. Verifica que hayas añadido la URL exacta de Supabase en Google Cloud Console
2. Formato correcto: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
3. No añadas barras finales (`/`) ni parámetros adicionales

### Error: "invalid_client"

**Causa**: Client ID o Client Secret incorrectos.

**Solución**:
1. Verifica que hayas copiado correctamente las credenciales de Google Cloud Console
2. Asegúrate de no tener espacios en blanco al inicio o final
3. Regenera las credenciales si es necesario

### El usuario se autentica pero no se crea el perfil

**Causa**: Error en la creación del perfil en la tabla `profiles`.

**Solución**:
1. Verifica los logs en Supabase (Authentication > Logs)
2. Asegúrate de que la tabla `profiles` existe
3. Verifica que las políticas RLS (Row Level Security) permitan la inserción

### La app no redirige a /app después del login

**Causa**: Error en el callback o en el middleware.

**Solución**:
1. Verifica que el archivo `src/app/auth/callback/route.ts` existe
2. Revisa los logs del navegador (Consola de desarrollador)
3. Verifica que el middleware (`src/middleware.ts`) esté configurado correctamente

## 📚 Archivos Relacionados

- `src/components/auth/GoogleLoginButton.tsx` - Componente del botón de Google
- `src/app/auth/callback/route.ts` - Maneja el callback de OAuth
- `src/app/(auth)/login/page.tsx` - Página de inicio de sesión
- `src/app/(auth)/registro/page.tsx` - Página de registro
- `src/app/(app)/perfil/page.tsx` - Página de perfil con opción de vincular

## 🎯 Características Implementadas

✅ Inicio de sesión con Google  
✅ Registro con Google  
✅ Vinculación de cuenta existente con Google  
✅ Redirección automática a `/app` después del login  
✅ Creación automática de perfil para nuevos usuarios de Google  
✅ Verificación automática de email (Google ya lo verificó)  

## 🔐 Seguridad

- Los tokens de OAuth se almacenan de forma segura en Supabase
- No se exponen credenciales de Google en el frontend
- Las redirecciones están controladas por Supabase
- El callback valida la sesión antes de crear el perfil

## 📞 Soporte

Si encuentras problemas adicionales:
1. Revisa los logs de Supabase: Authentication > Logs
2. Revisa la consola del navegador para errores de JavaScript
3. Verifica que todas las URLs estén correctamente configuradas
4. Contacta al equipo de desarrollo
