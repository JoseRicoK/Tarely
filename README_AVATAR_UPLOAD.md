# Sistema de Avatares Personalizados

## Descripción General

El sistema permite a los usuarios subir sus propias imágenes como avatares, además de los 6 avatares predefinidos. Los avatares personalizados se almacenan en Supabase Storage y utilizan un sistema de versionado para garantizar que se muestre siempre la imagen más reciente.

## Arquitectura

### Tipos de Avatares

1. **Avatares Predefinidos**: `avatar1.png`, `avatar2.png`, ..., `avatar6.png`
   - Ubicación: `avatars/avatarX.png`
   - Sin versionado (imágenes estáticas)

2. **Avatares Personalizados**: Imágenes subidas por el usuario
   - Ubicación: `avatars/{user_id}/avatar.{ext}`
   - Con versionado para cache busting
   - Formatos soportados: JPEG, PNG, WebP
   - Tamaño máximo: 5MB

### Esquema de Base de Datos

```sql
-- Campo existente
avatar TEXT

-- Campo agregado para versionado
avatar_version INTEGER DEFAULT 1
```

El campo `avatar_version` se incrementa cada vez que el usuario sube una nueva imagen personalizada.

### Storage

**Bucket**: `avatars`

**Estructura**:
```
avatars/
  ├── avatar1.png (predefinido)
  ├── avatar2.png (predefinido)
  ├── ...
  └── {user_id}/
      └── avatar.{ext} (personalizado)
```

**Políticas de Seguridad**:
- Los usuarios pueden subir archivos a su propia carpeta
- Todos pueden leer los avatares (públicos)

## Componentes

### 1. API Endpoint: `/api/auth/upload-avatar`

**Método**: POST

**Body**: `FormData` con campo `file`

**Validaciones**:
- Tipo de archivo: image/jpeg, image/png, image/webp
- Tamaño máximo: 5MB

**Proceso**:
1. Valida el archivo
2. Genera nombre de archivo: `{user_id}/avatar.{ext}`
3. Sube a Storage (reemplaza si existe)
4. Incrementa `avatar_version` en la tabla `profiles`
5. Actualiza el campo `avatar` con el nuevo path

**Respuesta**:
```json
{
  "success": true,
  "avatar": "{user_id}/avatar.webp",
  "version": 2
}
```

### 2. Helper Function: `getAvatarUrl()`

**Ubicación**: `src/lib/utils.ts`

**Función**:
```typescript
getAvatarUrl(avatar: string, version?: number): string
```

**Comportamiento**:
- Para avatares predefinidos: retorna URL sin versión
- Para avatares personalizados: agrega `?v={version}` para cache busting

**Ejemplo**:
```typescript
// Predefinido
getAvatarUrl("avatar1.png") 
// → "https://.../storage/v1/object/public/avatars/avatar1.png"

// Personalizado
getAvatarUrl("uuid-123/avatar.webp", 3)
// → "https://.../storage/v1/object/public/avatars/uuid-123/avatar.webp?v=3"
```

### 3. Página de Perfil

**Archivo**: `src/app/(app)/perfil/page.tsx`

**Funcionalidades**:
- Selector de avatares predefinidos
- Botón "Subir imagen personalizada"
- Preview de la imagen antes de subirla
- Estado de carga durante la subida
- Botón para quitar la imagen personalizada

**Estados**:
```typescript
isUploadingAvatar: boolean // Indica si se está subiendo
customAvatarPreview: string | null // Preview de la imagen seleccionada
```

**Handlers**:
- `handleFileChange`: Procesa el archivo, valida, muestra preview y sube
- `clearCustomAvatar`: Limpia el preview

## Flujo de Uso

### Subir Avatar Personalizado

1. Usuario hace clic en "Subir imagen personalizada"
2. Selecciona un archivo (JPG, PNG o WebP)
3. Se valida el archivo:
   - Si es mayor a 5MB → error
   - Si no es imagen válida → error
4. Se muestra preview de la imagen
5. Al hacer clic en "Guardar cambios":
   - Se sube la imagen a Storage
   - Se actualiza `avatar` y `avatar_version` en BD
   - Se refresca el perfil
6. La nueva imagen se muestra en toda la app

### Cache Busting

El sistema de versionado garantiza que los navegadores siempre muestren la imagen más reciente:

```
Primera subida: /avatars/uuid/avatar.webp?v=1
Segunda subida: /avatars/uuid/avatar.webp?v=2
```

Aunque el path del archivo es el mismo, el parámetro `?v=` cambia, forzando la descarga de la nueva versión.

## Componentes Actualizados

Los siguientes componentes ya usan `getAvatarUrl()` para mostrar avatares:

- ✅ `UserMenu.tsx` - Menu de usuario en el header
- ✅ `perfil/page.tsx` - Página de ajustes
- ⏳ Pendiente actualizar:
  - `CommentSection.tsx`
  - `AttachmentSection.tsx`
  - `ActivitySection.tsx`
  - `workspace/[id]/task/[taskId]/page.tsx`
  - `registro/page.tsx`

## Migración

### Aplicar Schema

Ejecutar en Supabase SQL Editor:

```sql
-- Agregar columna avatar_version
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_version INTEGER DEFAULT 1;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_version 
ON profiles(avatar_version);

-- Actualizar valores NULL a 1
UPDATE profiles 
SET avatar_version = 1 
WHERE avatar_version IS NULL;
```

### Configurar Storage

1. Ir a Storage en Supabase
2. El bucket `avatars` ya debe existir
3. Verificar políticas:
   - SELECT: público (cualquiera puede leer)
   - INSERT: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
   - UPDATE: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
   - DELETE: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

## Testing

### Test Manual

1. Ir a `/perfil`
2. Hacer clic en "Subir imagen personalizada"
3. Seleccionar una imagen JPG/PNG/WebP < 5MB
4. Verificar que se muestra el preview
5. Hacer clic en "Guardar cambios"
6. Verificar que la imagen se muestra en:
   - Avatar actual (círculo grande)
   - UserMenu (header)
7. Subir otra imagen
8. Verificar que se reemplaza correctamente (cache busting)

### Test de Errores

1. Intentar subir archivo > 5MB → debe mostrar error
2. Intentar subir PDF/TXT → debe mostrar error
3. Perder conexión durante subida → debe manejar error

## Mejoras Futuras

- [ ] Recorte de imagen (crop) antes de subir
- [ ] Compresión automática de imágenes grandes
- [ ] Soporte para eliminar avatar personalizado (volver a predefinido)
- [ ] Drag & drop para subir
- [ ] Validación de dimensiones mínimas (ej: 200x200px)
- [ ] Thumbnails/versiones optimizadas
