# 📧 Preview de los Correos Electrónicos

## Correo de Confirmación

El correo que reciben los usuarios al registrarse incluye:

### 🎨 Diseño
- **Header con gradiente** púrpura/azul
- **Logo de TareAI** con efecto de sombra
- **Título** "¡Bienvenido a TareAI!"
- **Mensaje personalizado** con el nombre del usuario
- **Botón destacado** "Confirmar mi correo" con gradiente y sombra
- **Enlace de respaldo** por si el botón no funciona
- **Footer** con información de copyright

### 📝 Contenido
```
Hola [Nombre del Usuario],

Gracias por registrarte en TareAI, tu asistente inteligente para la 
gestión de tareas. Estamos emocionados de tenerte con nosotros.

Para comenzar a usar tu cuenta, necesitamos que confirmes tu dirección 
de correo electrónico haciendo clic en el botón de abajo:

[Botón: Confirmar mi correo]

O copia y pega este enlace en tu navegador:
https://tuapp.com/api/auth/confirm?token=...

Este enlace expirará en 24 horas por razones de seguridad.

---

Si no creaste una cuenta en TareAI, puedes ignorar este correo.

© 2026 TareAI. Todos los derechos reservados.
Gestión inteligente de tareas con IA
```

---

## Correo de Bienvenida

Después de confirmar el email, se envía automáticamente:

### 🎨 Diseño
- **Header con gradiente** y ícono de ✓ verificado
- **Logo de TareAI**
- **Título** "¡Cuenta Confirmada!"
- **Mensaje de éxito**
- **Sección de características** con lista de lo que pueden hacer
- **Footer** con mensaje de ayuda

### 📝 Contenido
```
¡Excelente, [Nombre]!

Tu dirección de correo electrónico ha sido confirmada exitosamente. 
Ya puedes disfrutar de todas las funcionalidades de TareAI.

¿Qué puedes hacer ahora?

✨ Crear tareas con asistencia de IA
📊 Organizar tus proyectos en espacios de trabajo
👥 Colaborar con tu equipo
📅 Gestionar fechas y prioridades
🎯 Alcanzar tus objetivos de manera eficiente

Estamos aquí para ayudarte a ser más productivo. ¡Comienza ahora!

---

¿Necesitas ayuda? Estamos aquí para ti.

© 2026 TareAI. Todos los derechos reservados.
Gestión inteligente de tareas con IA
```

---

## 🎨 Características de Diseño

### Colores
- **Gradientes principales**: Púrpura (#667eea) a Azul (#764ba2)
- **Fondo**: Gris claro (#f4f4f7)
- **Texto**: Negro (#333333) y Gris (#555555)
- **Enlaces**: Púrpura (#667eea)

### Tipografía
- **Font**: Arial, Segoe UI, sans-serif
- **Tamaño título**: 28px
- **Tamaño texto**: 16px
- **Tamaño footer**: 12-13px

### Elementos Visuales
- **Logo**: 120px de ancho máximo
- **Botón**: Padding 16px/40px, border-radius 8px
- **Card**: Ancho máximo 600px, border-radius 16px
- **Sombras**: Box-shadow sutil para profundidad

### Responsive
- Compatible con todos los clientes de correo
- Adaptable a dispositivos móviles
- Tables para layout (compatibilidad con Outlook)

---

## 📱 Compatibilidad

✅ Gmail
✅ Outlook
✅ Apple Mail
✅ Yahoo Mail
✅ Dispositivos móviles
✅ Modo oscuro (se adapta automáticamente)

---

## 🧪 Testing

Para previsualizar los correos antes de enviarlos, puedes:

1. Usar [Resend Email Previews](https://resend.com/docs/dashboard/emails/send-test-email)
2. Enviar un email de prueba a ti mismo
3. Usar herramientas como [Litmus](https://litmus.com) o [Email on Acid](https://www.emailonacid.com)

---

## 🔧 Personalización

Para personalizar los correos, edita `src/lib/email-templates.ts`:

```typescript
// Cambiar colores del gradiente
background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);

// Cambiar el logo
<img src="TU_URL_DE_LOGO" alt="Tu App" />

// Modificar el contenido
<p>Tu texto personalizado aquí</p>
```

---

¡Los correos están listos para impresionar a tus usuarios! 🚀
