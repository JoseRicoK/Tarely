# Sistema de Sugerencias y Reporte de Errores

## Descripción

Este sistema permite a los usuarios enviar sugerencias para mejorar la aplicación o reportar errores encontrados durante su uso. La información se almacena junto con los datos del usuario para facilitar el seguimiento.

## Archivos Creados

### 1. Base de Datos

**Archivo:** `scripts/feedback-schema.sql`

Contiene el esquema SQL para crear la tabla `feedback` con:
- Campos: id, user_id, type, message, created_at, status, user_email, user_name
- Índices para mejorar rendimiento
- Políticas RLS (Row Level Security) para seguridad
- Tipos de feedback: `suggestion` (sugerencia) o `bug` (error)
- Estados: `pending`, `reviewed`, `resolved`

**Instrucciones de instalación:**
1. Accede a tu panel de Supabase
2. Ve a SQL Editor
3. Copia y ejecuta el contenido de `scripts/feedback-schema.sql`
4. Verifica que la tabla se haya creado correctamente

### 2. API Endpoint

**Archivo:** `src/app/api/feedback/route.ts`

Endpoints disponibles:
- `GET /api/feedback` - Obtiene el feedback del usuario actual
- `POST /api/feedback` - Crea nuevo feedback
  - Body: `{ type: "suggestion" | "bug", message: string }`
  - Validaciones: mensaje obligatorio, máximo 1000 caracteres
  - Obtiene automáticamente los datos del usuario desde la tabla `profiles`
- `DELETE /api/feedback?id={feedbackId}` - Elimina feedback del usuario

### 3. Componente de UI

**Archivo:** `src/components/workspace/FeedbackPanel.tsx`

Características:
- Selector visual de tipo (Sugerencia/Error)
- Área de texto con contador de caracteres (límite: 1000)
- Validación en tiempo real
- Indicadores visuales de estado
- Feedback visual al enviar

### 4. Integración en Página de Perfil

**Archivo:** `src/app/(app)/perfil/page.tsx`

Mejoras implementadas:
- Lazy loading del panel de feedback con `Suspense`
- Lazy loading del panel de invitaciones
- Hooks `useCallback` y `useMemo` para optimización
- Indicador visual de cambios sin guardar
- Mejor rendimiento de carga inicial

## Optimizaciones de Rendimiento

### Lazy Loading
Los componentes pesados (InvitationsPanel, FeedbackPanel) se cargan solo cuando son necesarios:
```tsx
const FeedbackPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.FeedbackPanel })));
```

### Memoización
- `useCallback`: Previene re-creación de funciones en cada render
- `useMemo`: Calcula si hay cambios sin guardar solo cuando cambian las dependencias

### Suspense
Loading states optimizados mientras cargan los componentes lazy:
```tsx
<Suspense fallback={<LoadingSpinner />}>
  <FeedbackPanel />
</Suspense>
```

## Uso

### Para el Usuario

1. Accede a la página de perfil (ajustes)
2. Desplázate hasta "Sugerencias y Errores"
3. Selecciona el tipo:
   - 💡 **Sugerencia**: Para ideas de mejora
   - 🐛 **Error**: Para reportar bugs
4. Escribe tu mensaje (máximo 1000 caracteres)
5. Haz clic en "Enviar sugerencia" o "Enviar reporte"

### Para el Administrador

El feedback se guarda con:
- ID del usuario
- Email y nombre del usuario
- Tipo de feedback
- Mensaje
- Fecha de creación
- Estado (pending por defecto)

Puedes consultar el feedback en Supabase:
```sql
SELECT * FROM feedback ORDER BY created_at DESC;
```

## Seguridad

- ✅ Autenticación requerida para todas las operaciones
- ✅ RLS habilitado - usuarios solo ven su propio feedback
- ✅ Validaciones server-side en el API
- ✅ Límite de caracteres para prevenir abuso
- ✅ Sanitización de datos

## Próximas Mejoras Sugeridas

- [ ] Panel de administración para revisar feedback
- [ ] Notificaciones al usuario cuando su feedback es revisado
- [ ] Búsqueda y filtrado de feedback
- [ ] Adjuntar capturas de pantalla
- [ ] Sistema de votos para sugerencias populares
- [ ] Categorización automática con IA

## Notas Técnicas

El API usa `eslint-disable` para `@typescript-eslint/no-explicit-any` en las queries de Supabase porque la tabla `feedback` no está en el schema de tipos generado. Esto es temporal hasta que regeneres los tipos de Supabase:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
```
