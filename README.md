# 🚀 Tarely - Gestión de Tareas con IA

Tarely es una aplicación moderna de gestión de tareas potenciada por inteligencia artificial que te ayuda a organizar tu trabajo de manera eficiente.

## ✨ Características

- 🤖 **Generación de tareas con IA** - Utiliza OpenAI para generar tareas y subtareas inteligentemente
- 📊 **Vista Kanban** - Organiza tus tareas con tableros visuales personalizables
- 👥 **Colaboración en tiempo real** - Comparte workspaces y asigna tareas a tu equipo
- 🎨 **Personalización** - Crea secciones con iconos y colores personalizados
- 📅 **Calendario integrado** - Visualiza tus tareas en un calendario mensual
- 📧 **Confirmación por email** - Sistema de verificación de cuentas con emails personalizados
- 🔒 **Autenticación segura** - Gestión de usuarios con Supabase Auth
- 🌐 **Interfaz moderna** - Diseño elegante con gradientes y animaciones

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **IA**: OpenAI GPT-4o-mini
- **Email**: Resend
- **Estilos**: Tailwind CSS 4, Radix UI
- **Drag & Drop**: dnd-kit
- **Validación**: Zod

## 📋 Prerequisitos

- Node.js 20+ y npm
- Cuenta de [Supabase](https://supabase.com)
- Cuenta de [Resend](https://resend.com) (para emails)
- Cuenta de [OpenAI](https://platform.openai.com) (para IA)

## ⚡ Instalación rápida

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd tareai
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y complétalo con tus credenciales:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_tu_api_key

# OpenAI
OPENAI_API_KEY=sk-tu-api-key
OPENAI_MODEL=gpt-4o-mini
```

### 4. Configurar la base de datos

Ejecuta los siguientes scripts SQL en tu proyecto de Supabase (en orden):

1. `scripts/schema.sql` - Esquema base
2. `scripts/auth-schema.sql` - Sistema de autenticación
3. `scripts/email-confirmation-schema.sql` - Confirmación de emails
4. `scripts/sections-schema.sql` - Secciones personalizables
5. `scripts/subtasks-schema.sql` - Sistema de subtareas
6. `scripts/sharing-schema.sql` - Compartir workspaces
7. `scripts/pending-registrations-schema.sql` - Registro pendiente

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🚀 Despliegue en producción

### Vercel (recomendado)

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente

### Otras plataformas

La aplicación es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 📖 Documentación adicional

- [Configuración de emails](./CONFIGURACION_EMAIL.md)
- [Instalación del sistema de emails](./INSTALACION_EMAIL.md)
- [Notas sobre Resend](./NOTAS_RESEND.md)
- [Preview de emails](./PREVIEW_EMAILS.md)

## 🏗️ Estructura del proyecto

```
tareai/
├── src/
│   ├── app/              # Rutas de Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── auth/         # Páginas de autenticación
│   │   ├── calendario/   # Vista de calendario
│   │   └── workspace/    # Vista principal de workspaces
│   ├── components/       # Componentes React
│   │   ├── auth/         # Componentes de autenticación
│   │   ├── tasks/        # Componentes de tareas
│   │   ├── ui/           # Componentes UI reutilizables
│   │   └── workspace/    # Componentes de workspaces
│   └── lib/              # Utilidades y configuración
├── scripts/              # Scripts SQL para Supabase
└── public/               # Archivos estáticos
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en la carpeta del proyecto
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de haber ejecutado todos los scripts SQL
4. Revisa los logs de la consola para errores específicos

## 🎯 Roadmap

- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Aplicación móvil nativa
- [ ] Integración con Google Calendar
- [ ] Exportar tareas a PDF/Excel
- [ ] Sistema de etiquetas avanzado
- [ ] Plantillas de tareas

---

Hecho con ❤️ usando Next.js y Supabase
