# Configuración de Internacionalización (i18n)

Este documento explica cómo completar la configuración de i18n con next-intl en Tarely.

## 📋 Pasos de Instalación

### 1. Instalar next-intl

```bash
npm install next-intl
```

### 2. Ejecutar el script SQL para añadir la columna locale

Ejecuta el script en tu base de datos de Supabase:

```bash
psql $DATABASE_URL -f scripts/add-locale-column.sql
```

O desde el dashboard de Supabase, ejecuta el contenido de `scripts/add-locale-column.sql`.

### 3. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## 🎯 Funcionalidades Implementadas

### ✅ Detección automática de idioma

- **Usuarios no autenticados**: Se detecta el idioma del navegador desde el header `Accept-Language`
- **Usuarios autenticados**: Se usa el idioma guardado en su perfil de base de datos

### ✅ Selector de idioma en Ajustes

- Los usuarios pueden cambiar su idioma preferido desde `/ajustes`
- El cambio se guarda en la base de datos y en una cookie persistente
- La app se recarga automáticamente para aplicar el nuevo idioma

### ✅ Caché persistente

- El locale se guarda en una cookie `NEXT_LOCALE` con duración de 1 año
- El middleware maneja la lógica de locale sin requerir queries extras innecesarias
- Next-intl cachea las traducciones para máxima eficiencia

### ✅ Rutas sin prefijo para español (por defecto)

- `tarely.com/dashboard` → Español
- `tarely.com/en/dashboard` → Inglés (futuro)

## 📁 Estructura de Archivos

```
messages/
  ├── es.json          # Traducciones en español
  └── en.json          # Traducciones en inglés

src/
  ├── i18n/
  │   ├── request.ts   # Configuración de next-intl
  │   └── navigation.ts # Helpers de navegación
  ├── lib/
  │   └── locale.ts    # Utilidades de locale
  ├── middleware-i18n.ts # Lógica de detección de locale
  └── middleware.ts    # Middleware principal (integrado)

src/app/api/auth/locale/
  └── route.ts         # API para cambiar idioma

src/components/settings/
  └── LanguageSelector.tsx # Selector de idioma
```

## 🔄 Flujo de Funcionamiento

### Usuario No Autenticado

1. El middleware lee el header `Accept-Language`
2. Si detecta `en`, usa inglés; sino español
3. Se guarda en cookie `NEXT_LOCALE`
4. Todas las páginas usan ese locale

### Usuario Autenticado (Nuevo)

1. Al registrarse, se detecta el idioma del navegador
2. Se guarda en la columna `locale` de la tabla `users`
3. El locale se usa en todas las sesiones futuras

### Usuario Autenticado (Existente)

1. Al hacer login, se lee `locale` desde la BD
2. Se guarda en cookie `NEXT_LOCALE`
3. Todas las páginas usan ese locale
4. El usuario puede cambiar el idioma desde `/ajustes`

## 🎨 Uso en Componentes

### Componentes del Cliente

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return <button>{t('save')}</button>;
}
```

### Componentes del Servidor

```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('common');
  
  return <h1>{t('title')}</h1>;
}
```

## 📝 Añadir Nuevas Traducciones

1. Edita `messages/es.json` y `messages/en.json`
2. Añade las claves en ambos archivos
3. Usa las traducciones con `useTranslations` o `getTranslations`

Ejemplo:

```json
// messages/es.json
{
  "myFeature": {
    "title": "Mi Función",
    "description": "Descripción de mi función"
  }
}

// messages/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Description of my feature"
  }
}
```

## 🚀 Próximos Pasos

1. ✅ Infraestructura completa
2. ✅ Selector de idioma en ajustes
3. ⏳ Traducir páginas existentes
4. ⏳ Añadir soporte de rutas con prefijo `/en` (opcional)
5. ⏳ Configurar SEO con hreflang para páginas públicas

## 🔧 Troubleshooting

### Los cambios de idioma no se aplican

- Verifica que la cookie `NEXT_LOCALE` se esté guardando
- Comprueba que el script SQL se haya ejecutado correctamente
- Reinicia el servidor de desarrollo

### Errores de TypeScript con next-intl

- Asegúrate de haber ejecutado `npm install next-intl`
- Reinicia el servidor TypeScript en tu IDE

### La columna locale no existe en la BD

- Ejecuta el script `scripts/add-locale-column.sql` en Supabase
